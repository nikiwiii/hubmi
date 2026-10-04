from datetime import datetime, timezone
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Response, status

from app.auth import CurrentUser, get_current_admin, get_current_user
from app.config import get_settings
from app.rate_limit import RateLimiter
from app.repository import GrantsRepository, IdeasRepository, RepositoryError, get_grants_repository, get_repository
from app.routers.calls import notify
from app.schemas import (
    APPLICATION_STATUS_LABELS,
    STAGE_DESCRIPTIONS,
    ApplicationCreate,
    ApplicationOut,
    ApplicationStatus,
    ApplicationStatusUpdate,
    ApplicationUpdate,
    CallField,
    CallOut,
    CallStatus,
    FieldDraftRequest,
    FieldDraftResponse,
    FieldQuestionRequest,
    FieldQuestionResponse,
    LLMFieldDraftOutput,
    LLMFieldQuestionOutput,
    LLMPrefillOutput,
    ProjectOut,
)
from app.services.documents import build_application_pdf
from app.services.llm import ChatLLM, generate_json, get_llm, to_prompt_json
from app.services.prompts import (
    APPLICATION_PREFILL_SYSTEM_PROMPT,
    APPLICATION_PREFILL_USER_TEMPLATE,
    FIELD_ASSIST_USER_TEMPLATE,
    FIELD_DRAFT_SYSTEM_PROMPT,
    FIELD_QUESTION_SYSTEM_PROMPT,
)

grants_rate_limiter = RateLimiter(max_requests=get_settings().grants_rate_limit_per_minute)

router = APIRouter(prefix="/applications", tags=["Grant applications"])

DB_ERROR_DETAIL = "Błąd bazy danych. Spróbuj ponownie za chwilę."
NOT_FOUND_DETAIL = "Wniosek o podanym ID nie istnieje."


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


def _db(fn, *args, **kwargs):
    try:
        return fn(*args, **kwargs)
    except RepositoryError:
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail=DB_ERROR_DETAIL)


def _load(grants: GrantsRepository, application_id: UUID, user: CurrentUser) -> tuple[ApplicationOut, CallOut]:
    """Application + its call; only the owner or an admin may see it (others get 404)."""
    application = _db(grants.get_application, str(application_id))
    if application is None or (application.user_id != user.id and not user.is_admin):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=NOT_FOUND_DETAIL)
    call = _db(grants.get_call, application.call_id)
    if call is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Nabór tego wniosku nie istnieje.")
    return application, call


def _require_editable(application: ApplicationOut, call: CallOut, user: CurrentUser) -> None:
    if application.user_id != user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Tylko autor może edytować wniosek.")
    if application.status != ApplicationStatus.DRAFT:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Wniosek został już wysłany i nie można go zmieniać.")
    if not call.is_open:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Nabór jest zamknięty.")


def _field(call: CallOut, field_id: str) -> CallField:
    field = next((f for f in call.fields if f.id == field_id), None)
    if field is None:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_CONTENT, detail="Nabór nie ma takiego pola.")
    return field


def _idea_json(idea: ProjectOut | None, author_name: str | None) -> str:
    if idea is None:
        return to_prompt_json({"autor": author_name or ""})
    return to_prompt_json(
        {
            "tytul": idea.tytul,
            "opis": idea.opis or "",
            "innowacyjnosc": idea.innowacyjnosc or "",
            "odbiorcy": idea.odbiorcy or "",
            "etap": STAGE_DESCRIPTIONS[idea.etap] if idea.etap else "",
            "kategoria": idea.category,
            "szuka_partnera": bool(idea.looking_for_partner),
            "typy_partnerow": idea.partner_types or [],
            "autor": idea.author_name or author_name or "",
        }
    )


def _fields_json(fields: list[CallField]) -> str:
    return to_prompt_json([f.model_dump(mode="json") for f in fields])


async def _prefill(llm: ChatLLM, call: CallOut, idea: ProjectOut) -> dict[str, str]:
    limits = {f.id: f.max_chars for f in call.fields}

    def check(result: LLMPrefillOutput) -> None:
        too_long = [k for k, v in result.answers.items() if v and limits.get(k) and len(v) > limits[k]]
        if too_long:
            raise ValueError(f"Odpowiedzi przekraczają max_chars w polach: {', '.join(too_long)}. Skróć je.")

    result = await generate_json(
        llm,
        APPLICATION_PREFILL_SYSTEM_PROMPT,
        APPLICATION_PREFILL_USER_TEMPLATE.format(
            call_title=call.title,
            call_description=call.description,
            fields_json=_fields_json(call.fields),
            idea_json=_idea_json(idea, idea.author_name),
        ),
        LLMPrefillOutput,
        extra_check=check,
    )
    return {k: v.strip() for k, v in result.answers.items() if k in limits and v and v.strip()}


@router.post(
    "",
    response_model=ApplicationOut,
    status_code=status.HTTP_201_CREATED,
    summary="Nowy wniosek z pomysłu; AI wypełnia go na podstawie fiszki (zwraca istniejący, jeśli już jest)",
)
async def create_application(
    body: ApplicationCreate,
    response: Response,
    user: CurrentUser = Depends(get_current_user),
    grants: GrantsRepository = Depends(get_grants_repository),
    ideas: IdeasRepository = Depends(get_repository),
    llm: ChatLLM = Depends(get_llm),
    _: None = Depends(grants_rate_limiter),
):
    call_id, idea_id = str(body.call_id), str(body.idea_id)
    call = _db(grants.get_call, call_id)
    if call is None or call.status == CallStatus.DRAFT:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Nabór o podanym ID nie istnieje.")
    if not call.is_open:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Nabór nie przyjmuje teraz wniosków.")

    idea = _db(ideas.get, idea_id)
    if idea is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Pomysł o podanym ID nie istnieje.")
    if idea.user_id != user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Do naboru można zgłosić tylko własny pomysł.")

    existing = _db(grants.list_applications, call_id=call_id, idea_id=idea_id)
    if existing:
        response.status_code = status.HTTP_200_OK
        existing[0].call = call
        return existing[0]

    answers = await _prefill(llm, call, idea)
    now = _now()
    application = _db(
        grants.create_application,
        {
            "call_id": call_id,
            "idea_id": idea_id,
            "user_id": user.id,
            "author_name": user.full_name,
            "idea_title": idea.tytul,
            "answers": answers,
            "ai_filled": sorted(answers),
            "status": ApplicationStatus.DRAFT.value,
            "updated_at": now,
        },
    )
    application.call = call
    return application


@router.get("/mine", response_model=list[ApplicationOut], summary="Moje wnioski (z danymi naboru)")
def my_applications(
    user: CurrentUser = Depends(get_current_user),
    grants: GrantsRepository = Depends(get_grants_repository),
):
    applications = _db(grants.list_applications, user_id=user.id)
    calls = {c.id: c for c in _db(grants.list_calls)}
    for application in applications:
        application.call = calls.get(application.call_id)
    return applications


@router.get("/{application_id}", response_model=ApplicationOut, summary="Szczegóły wniosku (autor lub admin)")
def get_application(
    application_id: UUID,
    user: CurrentUser = Depends(get_current_user),
    grants: GrantsRepository = Depends(get_grants_repository),
):
    application, call = _load(grants, application_id, user)
    application.call = call
    return application


@router.patch("/{application_id}", response_model=ApplicationOut, summary="Zapis odpowiedzi w szkicu wniosku")
def update_application(
    application_id: UUID,
    update: ApplicationUpdate,
    user: CurrentUser = Depends(get_current_user),
    grants: GrantsRepository = Depends(get_grants_repository),
):
    application, call = _load(grants, application_id, user)
    _require_editable(application, call, user)

    field_ids = {f.id for f in call.fields}
    answers = {k: v for k, v in update.answers.items() if k in field_ids}
    # A field stays marked as AI-filled only until the user changes it.
    ai_filled = [f for f in application.ai_filled if answers.get(f, "") == application.answers.get(f, "")]

    updated = _db(
        grants.update_application, application.id, {"answers": answers, "ai_filled": ai_filled, "updated_at": _now()}
    )
    updated.call = call
    return updated


@router.post("/{application_id}/submit", response_model=ApplicationOut, summary="Wysłanie wniosku do naboru")
def submit_application(
    application_id: UUID,
    user: CurrentUser = Depends(get_current_user),
    grants: GrantsRepository = Depends(get_grants_repository),
):
    application, call = _load(grants, application_id, user)
    _require_editable(application, call, user)

    missing = [f.label for f in call.fields if f.required and not application.answers.get(f.id, "").strip()]
    too_long = [
        f.label for f in call.fields if f.max_chars and len(application.answers.get(f.id, "")) > f.max_chars
    ]
    if missing or too_long:
        problems = []
        if missing:
            problems.append(f"Uzupełnij wymagane pola: {', '.join(missing)}.")
        if too_long:
            problems.append(f"Skróć pola przekraczające limit znaków: {', '.join(too_long)}.")
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_CONTENT, detail=" ".join(problems))

    now = _now()
    updated = _db(
        grants.update_application,
        application.id,
        {"status": ApplicationStatus.SUBMITTED.value, "submitted_at": now, "updated_at": now},
    )
    notify(
        title=f"Nowy wniosek w naborze: {call.title}",
        message=f"{user.full_name} złożył(a) wniosek „{application.idea_title}” w naborze „{call.title}”.",
        notif_type="grant_call",
        role_target="admin",
        link="/admin",
        recipient_email="admin@rops.krakow.pl",
        subject=f"[minno / ROPS Kraków] Nowy wniosek: {application.idea_title}",
    )
    updated.call = call
    return updated


@router.post(
    "/{application_id}/assist/question",
    response_model=FieldQuestionResponse,
    summary="Asystent: jedno pytanie pomagające uzupełnić pole",
)
async def assist_question(
    application_id: UUID,
    request: FieldQuestionRequest,
    user: CurrentUser = Depends(get_current_user),
    grants: GrantsRepository = Depends(get_grants_repository),
    ideas: IdeasRepository = Depends(get_repository),
    llm: ChatLLM = Depends(get_llm),
    _: None = Depends(grants_rate_limiter),
):
    application, call = _load(grants, application_id, user)
    _require_editable(application, call, user)
    field = _field(call, request.field_id)
    asked = {t.question.strip().lower() for t in request.history}

    def check(result: LLMFieldQuestionOutput) -> None:
        if result.question and result.question.strip().lower() in asked:
            raise ValueError('To pytanie było już zadane. Zadaj inne albo zwróć "question": null.')

    result = await generate_json(
        llm,
        FIELD_QUESTION_SYSTEM_PROMPT,
        _assist_prompt(application, field, request.history, ideas),
        LLMFieldQuestionOutput,
        extra_check=check,
    )
    question = (result.question or "").strip() or None
    return FieldQuestionResponse(question=question, done=question is None)


@router.post(
    "/{application_id}/assist/draft",
    response_model=FieldDraftResponse,
    summary="Asystent: propozycja treści pola na podstawie rozmowy (niczego nie zapisuje)",
)
async def assist_draft(
    application_id: UUID,
    request: FieldDraftRequest,
    user: CurrentUser = Depends(get_current_user),
    grants: GrantsRepository = Depends(get_grants_repository),
    ideas: IdeasRepository = Depends(get_repository),
    llm: ChatLLM = Depends(get_llm),
    _: None = Depends(grants_rate_limiter),
):
    application, call = _load(grants, application_id, user)
    _require_editable(application, call, user)
    field = _field(call, request.field_id)

    def check(result: LLMFieldDraftOutput) -> None:
        if not result.value.strip():
            raise ValueError('"value" nie może być puste.')
        if field.max_chars and len(result.value) > field.max_chars:
            raise ValueError(f'"value" ma {len(result.value)} znaków, limit to {field.max_chars}. Skróć treść.')

    result = await generate_json(
        llm,
        FIELD_DRAFT_SYSTEM_PROMPT,
        _assist_prompt(application, field, request.history, ideas),
        LLMFieldDraftOutput,
        extra_check=check,
    )
    return FieldDraftResponse(value=result.value.strip())


def _assist_prompt(application: ApplicationOut, field: CallField, history, ideas: IdeasRepository) -> str:
    idea = _db(ideas.get, application.idea_id) if application.idea_id else None
    others = {k: v for k, v in application.answers.items() if k != field.id and v.strip()}
    return FIELD_ASSIST_USER_TEMPLATE.format(
        field_json=to_prompt_json(field.model_dump(mode="json")),
        current_value=application.answers.get(field.id, "") or "(puste)",
        idea_json=_idea_json(idea, application.author_name),
        answers_json=to_prompt_json(others),
        history_json=to_prompt_json([t.model_dump() for t in history]),
    )


@router.patch("/{application_id}/status", response_model=ApplicationOut, summary="Zmiana statusu wniosku (admin)")
def update_status(
    application_id: UUID,
    update: ApplicationStatusUpdate,
    admin: CurrentUser = Depends(get_current_admin),
    grants: GrantsRepository = Depends(get_grants_repository),
):
    application, call = _load(grants, application_id, admin)
    if application.status == ApplicationStatus.DRAFT:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Wniosek nie został jeszcze wysłany.")

    values = {"status": update.status.value, "updated_at": _now()}
    if update.admin_comment is not None:
        values["admin_comment"] = update.admin_comment.strip() or None
    updated = _db(grants.update_application, application.id, values)

    if update.status != application.status:
        notify(
            title=f"Status wniosku: {APPLICATION_STATUS_LABELS[update.status]}",
            message=f"Twój wniosek „{application.idea_title}” w naborze „{call.title}” ma nowy status: "
            f"{APPLICATION_STATUS_LABELS[update.status]}.",
            notif_type="grant_call",
            role_target="user",
            link=f"/applications/{application.id}",
        )
    updated.call = call
    return updated


@router.get(
    "/{application_id}/pdf",
    response_class=Response,
    responses={200: {"content": {"application/pdf": {}}}},
    summary="Wniosek jako PDF (autor lub admin)",
)
def application_pdf(
    application_id: UUID,
    user: CurrentUser = Depends(get_current_user),
    grants: GrantsRepository = Depends(get_grants_repository),
):
    application, call = _load(grants, application_id, user)
    filename = f"wniosek-{application.id[:8]}.pdf"
    return Response(
        content=build_application_pdf(call, application),
        media_type="application/pdf",
        headers={"Content-Disposition": f'inline; filename="{filename}"'},
    )
