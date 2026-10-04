import logging
import re
import unicodedata
from datetime import datetime
from typing import Optional
from uuid import UUID

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status

from app.auth import CurrentUser, get_current_admin, get_current_user
from app.config import Settings, get_settings
from app.repository import GrantsRepository, RepositoryError, get_grants_repository
from app.schemas import (
    ApplicationOut,
    ApplicationStatus,
    CallField,
    CallOut,
    CallStatus,
    CallUpdate,
    LLMCallField,
    LLMCallFieldsOutput,
    as_utc,
)
from app.services.documents import LOCAL_TZ, TemplateError, extract_pdf_text
from app.services.llm import ChatLLM, generate_json, get_llm
from app.services.prompts import CALL_FIELDS_SYSTEM_PROMPT, CALL_FIELDS_USER_TEMPLATE
from app.services.storage import StorageError, TemplateStorage, get_template_storage

logger = logging.getLogger("idea_creator.calls")

router = APIRouter(prefix="/calls", tags=["Grant calls"])

DB_ERROR_DETAIL = "Błąd bazy danych. Spróbuj ponownie za chwilę."
NOT_FOUND_DETAIL = "Nabór o podanym ID nie istnieje."
_POLISH = str.maketrans({"ł": "l", "Ł": "l"})


def notify(**kwargs) -> None:
    """Notifications live in the main backend; standalone they are skipped."""
    try:
        from notifications.service import NotificationService

        NotificationService.create_notification(**kwargs)
    except Exception:
        pass


def _slug(label: str) -> str:
    text = unicodedata.normalize("NFKD", label.translate(_POLISH))
    text = "".join(c for c in text if not unicodedata.combining(c)).lower()
    return re.sub(r"[^a-z0-9]+", "_", text).strip("_")[:40] or "pole"


def to_call_fields(fields: list[LLMCallField]) -> list[CallField]:
    result, used = [], set()
    for field in fields:
        base = _slug(field.label)
        field_id, n = base, 2
        while field_id in used:
            field_id, n = f"{base}_{n}", n + 1
        used.add(field_id)
        result.append(CallField(id=field_id, **field.model_dump()))
    return result


async def extract_fields(llm: ChatLLM, template_text: str, settings: Settings) -> list[CallField]:
    result = await generate_json(
        llm,
        CALL_FIELDS_SYSTEM_PROMPT,
        CALL_FIELDS_USER_TEMPLATE.format(template_text=template_text[: settings.template_max_chars]),
        LLMCallFieldsOutput,
    )
    return to_call_fields(result.fields)


def _check_window(starts_at: datetime, ends_at: datetime) -> None:
    if ends_at <= starts_at:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
            detail="Data zakończenia naboru musi być późniejsza niż data rozpoczęcia.",
        )


def _get_call_or_404(grants: GrantsRepository, call_id: UUID) -> CallOut:
    try:
        call = grants.get_call(str(call_id))
    except RepositoryError:
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail=DB_ERROR_DETAIL)
    if call is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=NOT_FOUND_DETAIL)
    return call


@router.get("/open", response_model=list[CallOut], summary="Otwarte nabory (dla użytkowników)")
def list_open_calls(grants: GrantsRepository = Depends(get_grants_repository)):
    try:
        calls = grants.list_calls()
    except RepositoryError:
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail=DB_ERROR_DETAIL)
    return sorted((c for c in calls if c.is_open), key=lambda c: c.ends_at)


@router.get("", response_model=list[CallOut], summary="Wszystkie nabory z liczbą złożonych wniosków (admin)")
def list_calls(
    _: CurrentUser = Depends(get_current_admin),
    grants: GrantsRepository = Depends(get_grants_repository),
):
    try:
        calls = grants.list_calls()
        applications = grants.list_applications()
    except RepositoryError:
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail=DB_ERROR_DETAIL)
    for call in calls:
        call.applications_count = sum(
            1 for a in applications if a.call_id == call.id and a.status != ApplicationStatus.DRAFT
        )
    return calls


@router.post(
    "",
    response_model=CallOut,
    status_code=status.HTTP_201_CREATED,
    summary="Nowy nabór (szkic) z wzorem wniosku w PDF; AI wyciąga z niego pola (admin)",
)
async def create_call(
    title: str = Form(..., min_length=1, max_length=200),
    starts_at: datetime = Form(...),
    ends_at: datetime = Form(...),
    description: str = Form("", max_length=5000),
    template: UploadFile = File(..., description="Wzór wniosku (PDF)"),
    admin: CurrentUser = Depends(get_current_admin),
    grants: GrantsRepository = Depends(get_grants_repository),
    storage: TemplateStorage = Depends(get_template_storage),
    llm: ChatLLM = Depends(get_llm),
    settings: Settings = Depends(get_settings),
):
    starts_at, ends_at = as_utc(starts_at), as_utc(ends_at)
    _check_window(starts_at, ends_at)

    data = await template.read(settings.template_max_bytes + 1)
    if len(data) > settings.template_max_bytes:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"Plik PDF może mieć maksymalnie {settings.template_max_bytes // (1024 * 1024)} MB.",
        )
    if not data.startswith(b"%PDF-"):
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_CONTENT, detail="Plik musi być dokumentem PDF.")

    extraction_error: Optional[str] = None
    template_text = ""
    fields: list[CallField] = []
    try:
        template_text = extract_pdf_text(data)
        fields = await extract_fields(llm, template_text, settings)
    except TemplateError as e:
        extraction_error = str(e)
    except HTTPException as e:
        extraction_error = f"{e.detail} Możesz ponowić odczyt pól albo dodać je ręcznie."

    try:
        template_url = storage.upload(data)
    except StorageError:
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail="Nie udało się zapisać pliku PDF.")

    row = {
        "title": title.strip(),
        "description": description.strip(),
        "starts_at": starts_at.isoformat(),
        "ends_at": ends_at.isoformat(),
        "status": CallStatus.DRAFT.value,
        "template_url": template_url,
        "template_filename": (template.filename or "wniosek.pdf")[:255],
        "template_text": template_text,
        "fields": [f.model_dump(mode="json") for f in fields],
        "created_by": admin.id,
    }
    try:
        call = grants.create_call(row)
    except RepositoryError:
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail=DB_ERROR_DETAIL)
    call.extraction_error = extraction_error
    return call


@router.post("/{call_id}/extract-fields", response_model=CallOut, summary="Ponowny odczyt pól z PDF przez AI (admin)")
async def reextract_fields(
    call_id: UUID,
    _: CurrentUser = Depends(get_current_admin),
    grants: GrantsRepository = Depends(get_grants_repository),
    llm: ChatLLM = Depends(get_llm),
    settings: Settings = Depends(get_settings),
):
    call = _get_call_or_404(grants, call_id)
    if call.status != CallStatus.DRAFT:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT, detail="Pola można odczytać ponownie tylko w szkicu naboru."
        )
    try:
        template_text = grants.get_call_template_text(call.id)
    except RepositoryError:
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail=DB_ERROR_DETAIL)
    if not template_text:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
            detail="Wzór wniosku nie zawiera tekstu do odczytania. Dodaj pola ręcznie.",
        )
    fields = await extract_fields(llm, template_text, settings)
    try:
        return grants.update_call(call.id, {"fields": [f.model_dump(mode="json") for f in fields]})
    except RepositoryError:
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail=DB_ERROR_DETAIL)


@router.get("/{call_id}", response_model=CallOut, summary="Szczegóły naboru")
def get_call(
    call_id: UUID,
    user: CurrentUser = Depends(get_current_user),
    grants: GrantsRepository = Depends(get_grants_repository),
):
    call = _get_call_or_404(grants, call_id)
    if call.status == CallStatus.DRAFT and not user.is_admin:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=NOT_FOUND_DETAIL)
    return call


@router.patch("/{call_id}", response_model=CallOut, summary="Edycja naboru: dane, pola, publikacja, zamknięcie (admin)")
def update_call(
    call_id: UUID,
    update: CallUpdate,
    _: CurrentUser = Depends(get_current_admin),
    grants: GrantsRepository = Depends(get_grants_repository),
):
    call = _get_call_or_404(grants, call_id)
    values = update.model_dump(mode="json", exclude_unset=True)

    if call.status != CallStatus.DRAFT and "fields" in values:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Pól wniosku nie można zmieniać po publikacji naboru (wnioski mogą być już w przygotowaniu).",
        )
    _check_window(update.starts_at or call.starts_at, update.ends_at or call.ends_at)
    fields = update.fields if update.fields is not None else call.fields
    if update.status == CallStatus.PUBLISHED and not fields:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_CONTENT, detail="Nie można opublikować naboru bez pól wniosku."
        )
    if update.status == CallStatus.DRAFT and call.status != CallStatus.DRAFT:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Opublikowanego naboru nie można cofnąć do szkicu.")

    try:
        updated = grants.update_call(call.id, values) if values else call
    except RepositoryError:
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail=DB_ERROR_DETAIL)

    if update.status == CallStatus.PUBLISHED and call.status == CallStatus.DRAFT:
        notify(
            title=f"Nowy nabór: {updated.title}",
            message=f"Ruszył nabór wniosków „{updated.title}”. Możesz zgłosić swój pomysł z pulpitu (Moje pomysły) "
            f"do {updated.ends_at.astimezone(LOCAL_TZ).strftime('%d.%m.%Y')}.",
            notif_type="grant_call",
            role_target="all",
            link="/dashboard",
        )
    return updated


@router.get(
    "/{call_id}/applications",
    response_model=list[ApplicationOut],
    summary="Złożone wnioski w naborze, bez szkiców (admin)",
)
def list_call_applications(
    call_id: UUID,
    _: CurrentUser = Depends(get_current_admin),
    grants: GrantsRepository = Depends(get_grants_repository),
):
    _get_call_or_404(grants, call_id)
    try:
        applications = grants.list_applications(call_id=str(call_id))
    except RepositoryError:
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail=DB_ERROR_DETAIL)
    return [a for a in applications if a.status != ApplicationStatus.DRAFT]
