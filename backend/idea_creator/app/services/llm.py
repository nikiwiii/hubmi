import json
import logging
import re
from functools import lru_cache
from typing import Callable, Optional, Protocol, TypeVar

from fastapi import HTTPException, status
from pydantic import BaseModel, ValidationError

from app.config import get_settings
from app.services.prompts import RETRY_INSTRUCTION

logger = logging.getLogger("idea_creator.llm")

T = TypeVar("T", bound=BaseModel)

MAX_ERROR_CHARS = 1500
_FENCE_RE = re.compile(r"^\s*```(?:json)?\s*(.*?)\s*```\s*$", re.DOTALL)


class LLMUnavailableError(Exception):
    pass


class ChatLLM(Protocol):
    async def chat_json(self, messages: list[dict[str, str]]) -> str: ...


class GroqClient:
    """Thin wrapper over the Groq (OpenAI-compatible) chat completions API."""

    def __init__(self, api_key: str, model: str, base_url: str, timeout: float):
        from openai import AsyncOpenAI

        self._client = AsyncOpenAI(api_key=api_key, base_url=base_url, timeout=timeout, max_retries=1)
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
                        # Groq rejects non-JSON output in JSON mode; let generate_json retry it.
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


def _strip_code_fence(raw: str) -> str:
    match = _FENCE_RE.match(raw)
    return match.group(1) if match else raw.strip()


async def generate_json(
    llm: ChatLLM,
    system_prompt: str,
    user_prompt: str,
    model_cls: type[T],
    extra_check: Optional[Callable[[T], None]] = None,
) -> T:
    """Ask the LLM for JSON matching `model_cls`.

    On invalid output, retries once with the validation error appended; then HTTP 502.
    `extra_check` may raise ValueError for semantic rules beyond the schema.
    """
    messages = [
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": user_prompt},
    ]
    for attempt in range(2):
        try:
            raw = await llm.chat_json(messages)
        except LLMUnavailableError:
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail="Nie udało się połączyć z asystentem AI. Spróbuj ponownie za chwilę.",
            )
        try:
            result = model_cls.model_validate_json(_strip_code_fence(raw))
            if extra_check:
                extra_check(result)
            return result
        except (ValidationError, ValueError) as e:
            logger.warning("LLM output invalid for %s (attempt %d).", model_cls.__name__, attempt + 1)
            messages.append({"role": "assistant", "content": raw})
            messages.append(
                {"role": "user", "content": RETRY_INSTRUCTION.format(error=str(e)[:MAX_ERROR_CHARS])}
            )

    raise HTTPException(
        status_code=status.HTTP_502_BAD_GATEWAY,
        detail="Asystent AI zwrócił niepoprawną odpowiedź. Spróbuj ponownie za chwilę.",
    )


def to_prompt_json(data: dict) -> str:
    return json.dumps(data, ensure_ascii=False, indent=2)


@lru_cache
def _groq_client() -> GroqClient:
    settings = get_settings()
    return GroqClient(
        api_key=settings.groq_api_key,
        model=settings.groq_model,
        base_url=settings.groq_base_url,
        timeout=settings.groq_timeout_seconds,
    )


def get_llm() -> ChatLLM:
    if not get_settings().groq_api_key:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Asystent AI nie jest skonfigurowany (brak GROQ_API_KEY).",
        )
    return _groq_client()
