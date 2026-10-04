import json
import logging
import re
from functools import lru_cache
from typing import Any, Dict, Optional, Protocol

from fastapi import HTTPException, status
from pydantic import ValidationError

from config import GROQ_API_KEY, GROQ_MODEL
from supabase_client import DatabaseRepository
from middleman.prompts import ADAPT_USER_PROMPT, REFINE_USER_PROMPT, RETRY_INSTRUCTION, SYSTEM_PROMPT
from middleman.schemas import (
    BUDGET_DISCLAIMER,
    BUDGET_LABELS,
    BUDGET_UPPER_LIMITS_PLN,
    INSTITUTION_TYPE_LABELS,
    InstitutionProfile,
    ServiceCard,
)

logger = logging.getLogger("hubmi.middleman")

GROQ_BASE_URL = "https://api.groq.com/openai/v1"
GROQ_TIMEOUT_SECONDS = 60.0
MAX_ATTEMPTS = 2
MAX_ERROR_CHARS = 1500
_FENCE_RE = re.compile(r"^\s*```(?:json)?\s*(.*?)\s*```\s*$", re.DOTALL)


class LLMUnavailableError(Exception):
    pass


class ChatLLM(Protocol):
    async def chat_json(self, messages: list[dict[str, str]]) -> str: ...


class GroqClient:
    """Minimalny klient Groq (API zgodne z OpenAI) wymuszający odpowiedź w trybie JSON."""

    def __init__(self, api_key: str, model: str):
        from openai import AsyncOpenAI

        self._client = AsyncOpenAI(
            api_key=api_key, base_url=GROQ_BASE_URL, timeout=GROQ_TIMEOUT_SECONDS, max_retries=1
        )
        self._model = model
        self._json_mode = True

    async def chat_json(self, messages: list[dict[str, str]]) -> str:
        import openai

        kwargs = {"model": self._model, "messages": messages, "temperature": 0.3}
        try:
            if self._json_mode:
                try:
                    response = await self._client.chat.completions.create(
                        **kwargs, response_format={"type": "json_object"}
                    )
                except openai.BadRequestError as e:
                    if "json_validate_failed" in str(e):
                        # Groq odrzuca nie-JSON w trybie JSON; pętla w generate_card ponowi zapytanie.
                        return ""
                    logger.warning("Model %s rejected JSON mode; falling back to plain output.", self._model)
                    self._json_mode = False
                    response = await self._client.chat.completions.create(**kwargs)
            else:
                response = await self._client.chat.completions.create(**kwargs)
        except openai.OpenAIError as e:
            logger.error("Groq request failed: %s", type(e).__name__)
            raise LLMUnavailableError(type(e).__name__) from e

        return response.choices[0].message.content or ""


@lru_cache
def _groq_client() -> GroqClient:
    return GroqClient(api_key=GROQ_API_KEY, model=GROQ_MODEL)


def get_llm() -> ChatLLM:
    if not GROQ_API_KEY:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Asystent AI nie jest skonfigurowany (brak GROQ_API_KEY).",
        )
    return _groq_client()


def _strip_code_fence(raw: str) -> str:
    match = _FENCE_RE.match(raw)
    return match.group(1) if match else raw.strip()


def _to_prompt_json(data: Any) -> str:
    return json.dumps(data, ensure_ascii=False, indent=2)


def get_innovation_or_404(innovation_id: str) -> Dict[str, Any]:
    item = DatabaseRepository.get_innovation_by_id(innovation_id)
    if not item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Innowacja o identyfikatorze '{innovation_id}' nie została znaleziona w bazie danych.",
        )
    return item


def innovation_for_prompt(item: Dict[str, Any]) -> Dict[str, Any]:
    return {
        "title": item.get("title"),
        "category": item.get("category"),
        "description": item.get("description"),
        "addressed_problems": item.get("addressed_problems") or item.get("addresed_problems"),
        "target_group": item.get("target_group"),
        "beneficiaries": item.get("beneficiaries"),
        "validation": item.get("validation"),
        "funding_info": item.get("funding_info"),
        "video_url": item.get("video_url"),
    }


def profile_for_prompt(profile: InstitutionProfile) -> Dict[str, Any]:
    return {
        "typ_instytucji": INSTITUTION_TYPE_LABELS[profile.institution_type],
        "nazwa": profile.institution_name or "nie podano",
        "powiat": f"{profile.powiat} (województwo małopolskie)",
        "grupa_docelowa": profile.target_group,
        "przyblizona_liczba_odbiorcow": profile.recipients_count or "nie podano",
        "dostepny_budzet": BUDGET_LABELS[profile.budget_range],
        "obecna_kadra_instytucji": profile.staff_resources,
        "horyzont_czasowy": f"{profile.time_horizon_months} miesięcy",
        "lokalny_problem_i_uwagi": profile.local_context or "brak",
    }


def _normalize(card: ServiceCard) -> ServiceCard:
    card.budget.total_pln = sum(item.amount_pln for item in card.budget.items)
    card.budget.disclaimer = BUDGET_DISCLAIMER
    return card


def _over_budget_limit(card: ServiceCard, profile: InstitutionProfile) -> Optional[int]:
    limit = BUDGET_UPPER_LIMITS_PLN[profile.budget_range]
    if limit is not None and card.budget.total_pln > limit:
        return limit
    return None


def _budget_problem(card: ServiceCard, profile: InstitutionProfile) -> Optional[str]:
    """Przekroczenie budżetu jest dopuszczalne tylko wtedy, gdy karta uczciwie to opisuje w `feasibility_note`."""
    limit = _over_budget_limit(card, profile)
    if limit is None or card.feasibility_note:
        return None
    return (
        f"Suma pozycji budżetu ({card.budget.total_pln} zł) przekracza górną granicę "
        f"dostępnego budżetu instytucji ({limit} zł). Zmniejsz ZAKRES usługi (nie obniżaj stawek). "
        "Jeśli nawet minimalna wersja się nie mieści, zostaw realne koszty i opisz problem w „feasibility_note”."
    )


def _with_default_feasibility_note(card: ServiceCard, profile: InstitutionProfile) -> ServiceCard:
    limit = _over_budget_limit(card, profile)
    if limit is not None and not card.feasibility_note:
        card.feasibility_note = (
            f"Szacowane koszty ({card.budget.total_pln} zł) przekraczają dostępny budżet (do {limit} zł). "
            "Wdrożenie w tej skali będzie trudne – rozważ mniejszy zakres, dodatkowe dofinansowanie "
            "lub konsultację z ekspertem ROPS."
        )
    return card


async def generate_card(llm: ChatLLM, user_prompt: str, profile: InstitutionProfile) -> ServiceCard:
    """Generuje kartę usługi; przy niepoprawnym JSON lub nieopisanym przekroczeniu budżetu ponawia raz z opisem błędu.

    Karta poprawna strukturalnie, ale wciąż przekraczająca budżet po ponowieniu, jest zwracana z domyślnym
    ostrzeżeniem w `feasibility_note`, żeby użytkownik mógł ją poprawić przez „Dopytaj / popraw”.
    """
    messages = [
        {"role": "system", "content": SYSTEM_PROMPT},
        {"role": "user", "content": user_prompt},
    ]
    fallback: Optional[ServiceCard] = None

    for attempt in range(MAX_ATTEMPTS):
        try:
            raw = await llm.chat_json(messages)
        except LLMUnavailableError:
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail="Nie udało się połączyć z asystentem AI. Spróbuj ponownie za chwilę.",
            )

        try:
            card = _normalize(ServiceCard.model_validate_json(_strip_code_fence(raw)))
        except ValidationError as e:
            error = str(e)[:MAX_ERROR_CHARS]
            logger.warning("Middleman LLM output invalid (attempt %d): %s", attempt + 1, error[:300])
        else:
            problem = _budget_problem(card, profile)
            if problem is None:
                return card
            logger.warning("Middleman card over budget (attempt %d).", attempt + 1)
            fallback = card
            error = problem

        messages.append({"role": "assistant", "content": raw})
        messages.append({"role": "user", "content": RETRY_INSTRUCTION.format(error=error)})

    if fallback is not None:
        return _with_default_feasibility_note(fallback, profile)
    raise HTTPException(
        status_code=status.HTTP_502_BAD_GATEWAY,
        detail="Asystent AI zwrócił niepoprawną odpowiedź. Spróbuj ponownie za chwilę.",
    )


async def adapt_innovation(llm: ChatLLM, innovation: Dict[str, Any], profile: InstitutionProfile) -> ServiceCard:
    prompt = ADAPT_USER_PROMPT.format(
        innovation=_to_prompt_json(innovation_for_prompt(innovation)),
        profile=_to_prompt_json(profile_for_prompt(profile)),
    )
    return await generate_card(llm, prompt, profile)


async def refine_card(
    llm: ChatLLM,
    innovation: Dict[str, Any],
    profile: InstitutionProfile,
    card: ServiceCard,
    instruction: str,
) -> ServiceCard:
    prompt = REFINE_USER_PROMPT.format(
        innovation=_to_prompt_json(innovation_for_prompt(innovation)),
        profile=_to_prompt_json(profile_for_prompt(profile)),
        card=_to_prompt_json(card.model_dump(exclude={"budget": {"total_pln", "disclaimer"}})),
        instruction=instruction.strip(),
    )
    return await generate_card(llm, prompt, profile)
