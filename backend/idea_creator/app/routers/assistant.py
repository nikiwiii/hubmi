from fastapi import APIRouter, Depends

from app.config import get_settings
from app.rate_limit import RateLimiter
from app.schemas import (
    MAX_ROUNDS,
    FieldChange,
    IdeaDraft,
    LLMQuestionOutput,
    LLMRefineOutput,
    Question,
    QuestionRequest,
    QuestionResponse,
    RefineRequest,
    RefineResponse,
    Stage,
)
from app.services.llm import ChatLLM, generate_json, get_llm, to_prompt_json
from app.services.prompts import (
    QUESTION_SYSTEM_PROMPT,
    QUESTION_USER_TEMPLATE,
    REFINE_SYSTEM_PROMPT,
    REFINE_USER_TEMPLATE,
)

assistant_rate_limiter = RateLimiter(max_requests=get_settings().assistant_rate_limit_per_minute)

router = APIRouter(
    prefix="/assistant",
    tags=["AI Assistant"],
    dependencies=[Depends(assistant_rate_limiter)],
)

DRAFT_FIELDS = {"tytul", "opis", "innowacyjnosc", "odbiorcy", "etap"}
STAGE_VALUES = {stage.value for stage in Stage}


def _draft_json(draft: IdeaDraft) -> str:
    return to_prompt_json(draft.model_dump(mode="json", include=DRAFT_FIELDS))


def _normalize(text: str) -> str:
    return " ".join(text.lower().split()).rstrip("?.! ")


@router.post("/questions", response_model=QuestionResponse, summary="Jedno pytanie doprecyzowujące (runda pętli)")
async def next_question(request: QuestionRequest, llm: ChatLLM = Depends(get_llm)):
    rounds_used = len(request.history)
    if rounds_used >= MAX_ROUNDS:
        return QuestionResponse(question=None, completeness=None, round=rounds_used, done=True)

    asked = {_normalize(entry.question) for entry in request.history}

    def check(result: LLMQuestionOutput) -> None:
        if result.question and _normalize(result.question.text) in asked:
            raise ValueError("To pytanie było już zadane. Zadaj inne pytanie albo zwróć \"question\": null.")

    result = await generate_json(
        llm,
        QUESTION_SYSTEM_PROMPT,
        QUESTION_USER_TEMPLATE.format(
            idea_json=_draft_json(request),
            history_json=to_prompt_json([entry.model_dump() for entry in request.history]),
        ),
        LLMQuestionOutput,
        extra_check=check,
    )

    if result.question is None:
        return QuestionResponse(question=None, completeness=result.completeness, round=rounds_used, done=True)

    return QuestionResponse(
        question=Question(id=f"q{rounds_used + 1}", field=result.question.field, text=result.question.text),
        completeness=result.completeness,
        round=rounds_used + 1,
        done=False,
    )


@router.post("/refine", response_model=RefineResponse, summary="Propozycja zmiany jednego pola po odpowiedzi")
async def refine_field(request: RefineRequest, llm: ChatLLM = Depends(get_llm)):
    """Stateless: changes only the field the question was about; nothing is saved."""
    field = request.question.field
    current = getattr(request, field)

    def check(result: LLMRefineOutput) -> None:
        if field == "etap" and result.value is not None and result.value not in STAGE_VALUES:
            raise ValueError(f'"value" dla pola "etap" musi być jedną z wartości: {sorted(STAGE_VALUES)} albo null.')

    result = await generate_json(
        llm,
        REFINE_SYSTEM_PROMPT,
        REFINE_USER_TEMPLATE.format(
            idea_json=_draft_json(request),
            field=field,
            question=request.question.text,
            answer=request.answer,
        ),
        LLMRefineOutput,
        extra_check=check,
    )

    proposal = IdeaDraft(**request.model_dump(include=DRAFT_FIELDS))
    if field == "etap":
        new_value = Stage(result.value) if result.value else current
    else:
        new_value = (result.value or "").strip() or current
    setattr(proposal, field, new_value)

    changes = []
    if new_value != current:
        changes.append(FieldChange(field=field, summary=result.summary.strip() or "Zaktualizowano treść pola."))

    return RefineResponse(proposal=proposal, changes=changes)
