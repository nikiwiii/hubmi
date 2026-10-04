import base64
import binascii
import re
from datetime import datetime, timezone
from enum import Enum
from typing import Literal, Optional
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator


class Stage(str, Enum):
    """Allowed values of `etap` / `ideas.stage`. Single source of truth."""

    POMYSL = "pomysl"
    PROTOTYP = "prototyp"
    PRZETESTOWANE_ROZWIAZANIE = "przetestowane_rozwiazanie"
    GOTOWE_DO_WDROZENIA = "gotowe_do_wdrozenia"


STAGE_DESCRIPTIONS: dict[Stage, str] = {
    Stage.POMYSL: "tylko pomysł, nic jeszcze nie zostało zbudowane",
    Stage.PROTOTYP: "istnieje prototyp lub pilotaż",
    Stage.PRZETESTOWANE_ROZWIAZANIE: "rozwiązanie zostało przetestowane w praktyce (np. w mikroskali)",
    Stage.GOTOWE_DO_WDROZENIA: "przetestowane i gotowe do wdrożenia na szerszą skalę",
}

IdeaField = Literal["tytul", "opis", "innowacyjnosc", "odbiorcy", "etap"]


def _empty_to_none(value):
    if isinstance(value, str) and not value.strip():
        return None
    return value


MAX_IMAGE_BYTES = 8 * 1024 * 1024
IMAGE_CONTENT_TYPES = {"image/png": "png", "image/jpeg": "jpg", "image/webp": "webp"}
_DATA_URL_RE = re.compile(r"^data:(image/[a-z]+);base64,(.+)$", re.DOTALL)


def parse_image_data_url(value: str) -> tuple[bytes, str]:
    """Decodes a base64 image data URL into (bytes, content type); raises ValueError if invalid."""
    match = _DATA_URL_RE.match(value)
    if not match or match.group(1) not in IMAGE_CONTENT_TYPES:
        raise ValueError(f"Obraz musi być data URL typu: {', '.join(IMAGE_CONTENT_TYPES)}.")
    try:
        data = base64.b64decode(match.group(2), validate=True)
    except binascii.Error:
        raise ValueError("Obraz ma niepoprawne kodowanie base64.")
    if not data or len(data) > MAX_IMAGE_BYTES:
        raise ValueError(f"Obraz musi mieć od 1 B do {MAX_IMAGE_BYTES // (1024 * 1024)} MB.")
    return data, match.group(1)


# ---------- Assistant ----------


class IdeaDraft(BaseModel):
    """Work-in-progress idea; every field may be empty."""

    tytul: str = ""
    opis: str = ""
    innowacyjnosc: str = ""
    odbiorcy: str = ""
    etap: Optional[Stage] = None

    @field_validator("tytul", "opis", "innowacyjnosc", "odbiorcy", mode="before")
    @classmethod
    def none_to_empty(cls, value):
        return "" if value is None else value

    @field_validator("etap", mode="before")
    @classmethod
    def blank_stage_to_none(cls, value):
        return _empty_to_none(value)


MAX_ROUNDS = 10


class Question(BaseModel):
    id: str
    field: IdeaField
    text: str = Field(..., min_length=1)


class HistoryEntry(BaseModel):
    """One finished round. Empty `answer` = skipped; `accepted` = the user's decision on the proposal."""

    field: IdeaField
    question: str
    answer: str = ""
    accepted: Optional[bool] = None


class QuestionRequest(IdeaDraft):
    history: list[HistoryEntry] = Field(default_factory=list, max_length=MAX_ROUNDS)


class QuestionResponse(BaseModel):
    question: Optional[Question] = None
    completeness: Optional[int] = Field(None, ge=0, le=100)
    round: int = Field(..., description="Number of the returned question (1-based), or rounds used when done.")
    max_rounds: int = MAX_ROUNDS
    done: bool


class RefineRequest(IdeaDraft):
    question: Question
    answer: str = Field(..., min_length=1)

    @field_validator("answer")
    @classmethod
    def answer_not_blank(cls, value: str) -> str:
        if not value.strip():
            raise ValueError("Odpowiedź nie może być pusta.")
        return value.strip()


class FieldChange(BaseModel):
    field: IdeaField
    summary: str = Field(..., min_length=1)


class RefineResponse(BaseModel):
    proposal: IdeaDraft
    changes: list[FieldChange] = Field(default_factory=list, max_length=1)


# ---------- Visualization ----------


class GenerateImageRequest(IdeaDraft):
    category: Optional[str] = None

    @model_validator(mode="after")
    def requires_content(self):
        if not (self.tytul.strip() or self.opis.strip()):
            raise ValueError("Uzupełnij przynajmniej tytuł lub opis, aby wygenerować obraz.")
        return self


class GenerateImageResponse(BaseModel):
    image: str = Field(..., description="Data URL (base64) of the generated image.")
    prompt: str
    model: str


# ---------- LLM output contracts ----------


class LLMQuestion(BaseModel):
    field: IdeaField
    text: str = Field(..., min_length=1)


class LLMQuestionOutput(BaseModel):
    question: Optional[LLMQuestion] = None
    completeness: int = Field(..., ge=0, le=100)


class LLMRefineOutput(BaseModel):
    """New value for the single targeted field. For `etap` it must be a Stage value or null."""

    value: Optional[str] = None
    summary: str = ""


class LLMImagePromptOutput(BaseModel):
    prompt: str = Field(..., min_length=20, max_length=1500)


# ---------- Projects ----------


class ProjectCreate(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)

    tytul: str = Field(..., min_length=1, max_length=200)
    opis: str = Field(..., min_length=1)
    innowacyjnosc: str = Field(..., min_length=1)
    odbiorcy: str = Field(..., min_length=1)
    etap: Stage
    category: Optional[str] = None
    image: Optional[str] = Field(None, description="Visualization from /generate_image (data URL); stored on publish.")
    looking_for_partner: Optional[bool] = False
    partner_types: Optional[list[str]] = Field(default_factory=list)

    @field_validator("category", "image", mode="before")
    @classmethod
    def blank_to_none(cls, value):
        return _empty_to_none(value)

    @field_validator("image")
    @classmethod
    def valid_image(cls, value: Optional[str]) -> Optional[str]:
        if value is not None:
            parse_image_data_url(value)
        return value


class ProjectOut(BaseModel):
    id: str
    tytul: str
    opis: Optional[str] = None
    innowacyjnosc: Optional[str] = None
    odbiorcy: Optional[str] = None
    etap: Optional[Stage] = None
    category: str = "general"
    user_id: Optional[str] = None
    author_name: Optional[str] = None
    image_url: Optional[str] = None
    created_at: Optional[str] = None
    looking_for_partner: Optional[bool] = False
    partner_types: Optional[list[str]] = Field(default_factory=list)
    assigned_expert_id: Optional[str] = None
    assigned_expert_name: Optional[str] = None
    assigned_expert_specialization: Optional[str] = None

    @model_validator(mode="before")
    @classmethod
    def stringify(cls, data):
        if isinstance(data, dict):
            data = dict(data)
            for key in ("id", "user_id", "created_at"):
                if data.get(key) is not None:
                    data[key] = str(data[key])
            if not data.get("category"):
                data["category"] = "general"
        return data


# ---------- Grant calls (nabory) ----------


class FieldType(str, Enum):
    SHORT_TEXT = "short_text"
    LONG_TEXT = "long_text"
    NUMBER = "number"
    DATE = "date"


class CallStatus(str, Enum):
    DRAFT = "draft"
    PUBLISHED = "published"
    CLOSED = "closed"


MAX_CALL_FIELDS = 80
MAX_ANSWER_CHARS = 50000
FIELD_ID_PATTERN = r"^[a-z0-9_]{1,60}$"


class CallField(BaseModel):
    """One field of an application form; the list of these is the call's template."""

    model_config = ConfigDict(str_strip_whitespace=True)

    id: str = Field(..., pattern=FIELD_ID_PATTERN)
    label: str = Field(..., min_length=1, max_length=300)
    section: str = Field("", max_length=200)
    help: str = Field("", max_length=2000)
    type: FieldType = FieldType.LONG_TEXT
    required: bool = False
    max_chars: Optional[int] = Field(None, ge=1, le=MAX_ANSWER_CHARS)

    @field_validator("section", "help", mode="before")
    @classmethod
    def none_to_empty(cls, value):
        return "" if value is None else value


def _check_unique_field_ids(fields: Optional[list[CallField]]) -> Optional[list[CallField]]:
    if fields is not None:
        ids = [f.id for f in fields]
        duplicates = sorted({i for i in ids if ids.count(i) > 1})
        if duplicates:
            raise ValueError(f"Identyfikatory pól muszą być unikalne (powtórzone: {', '.join(duplicates)}).")
    return fields


def as_utc(value: Optional[datetime]) -> Optional[datetime]:
    if value is not None and value.tzinfo is None:
        return value.replace(tzinfo=timezone.utc)
    return value


class CallUpdate(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)

    title: Optional[str] = Field(None, min_length=1, max_length=200)
    description: Optional[str] = Field(None, max_length=5000)
    starts_at: Optional[datetime] = None
    ends_at: Optional[datetime] = None
    status: Optional[CallStatus] = None
    fields: Optional[list[CallField]] = Field(None, max_length=MAX_CALL_FIELDS)

    @field_validator("fields")
    @classmethod
    def unique_ids(cls, value):
        return _check_unique_field_ids(value)

    @field_validator("starts_at", "ends_at")
    @classmethod
    def utc(cls, value):
        return as_utc(value)


class CallOut(BaseModel):
    id: str
    title: str
    description: str = ""
    starts_at: datetime
    ends_at: datetime
    status: CallStatus
    template_url: Optional[str] = None
    template_filename: Optional[str] = None
    fields: list[CallField] = Field(default_factory=list)
    created_at: Optional[str] = None
    is_open: bool = False
    applications_count: Optional[int] = None
    extraction_error: Optional[str] = Field(None, description="Set when the AI could not extract fields from the PDF.")

    @model_validator(mode="before")
    @classmethod
    def prepare(cls, data):
        if isinstance(data, dict):
            data = dict(data)
            for key in ("id", "created_at"):
                if data.get(key) is not None:
                    data[key] = str(data[key])
            data["description"] = data.get("description") or ""
            data["fields"] = data.get("fields") or []
        return data

    @model_validator(mode="after")
    def compute_is_open(self):
        self.starts_at, self.ends_at = as_utc(self.starts_at), as_utc(self.ends_at)
        now = datetime.now(timezone.utc)
        self.is_open = self.status == CallStatus.PUBLISHED and self.starts_at <= now <= self.ends_at
        return self


# ---------- Grant applications (wnioski) ----------


class ApplicationStatus(str, Enum):
    DRAFT = "draft"
    SUBMITTED = "submitted"
    UNDER_REVIEW = "under_review"
    ACCEPTED = "accepted"
    REJECTED = "rejected"


APPLICATION_STATUS_LABELS: dict[ApplicationStatus, str] = {
    ApplicationStatus.DRAFT: "Szkic",
    ApplicationStatus.SUBMITTED: "Złożony",
    ApplicationStatus.UNDER_REVIEW: "W ocenie",
    ApplicationStatus.ACCEPTED: "Zaakceptowany",
    ApplicationStatus.REJECTED: "Odrzucony",
}


class ApplicationCreate(BaseModel):
    call_id: UUID
    idea_id: UUID


class ApplicationUpdate(BaseModel):
    answers: dict[str, str] = Field(default_factory=dict)

    @field_validator("answers")
    @classmethod
    def limit_lengths(cls, value: dict[str, str]) -> dict[str, str]:
        if any(len(v) > MAX_ANSWER_CHARS for v in value.values()):
            raise ValueError(f"Odpowiedź może mieć maksymalnie {MAX_ANSWER_CHARS} znaków.")
        return value


class ApplicationStatusUpdate(BaseModel):
    status: ApplicationStatus
    admin_comment: Optional[str] = Field(None, max_length=5000)

    @field_validator("status")
    @classmethod
    def not_draft(cls, value: ApplicationStatus) -> ApplicationStatus:
        if value == ApplicationStatus.DRAFT:
            raise ValueError("Złożonego wniosku nie można cofnąć do szkicu.")
        return value


class ApplicationOut(BaseModel):
    id: str
    call_id: str
    idea_id: Optional[str] = None
    user_id: str
    author_name: Optional[str] = None
    idea_title: Optional[str] = None
    answers: dict[str, str] = Field(default_factory=dict)
    ai_filled: list[str] = Field(default_factory=list, description="Field ids filled by AI and not edited since.")
    status: ApplicationStatus
    admin_comment: Optional[str] = None
    created_at: Optional[str] = None
    updated_at: Optional[str] = None
    submitted_at: Optional[str] = None
    call: Optional[CallOut] = None

    @model_validator(mode="before")
    @classmethod
    def prepare(cls, data):
        if isinstance(data, dict):
            data = dict(data)
            for key in ("id", "call_id", "idea_id", "user_id", "created_at", "updated_at", "submitted_at"):
                if data.get(key) is not None:
                    data[key] = str(data[key])
            data["answers"] = {k: v for k, v in (data.get("answers") or {}).items() if isinstance(v, str)}
            data["ai_filled"] = data.get("ai_filled") or []
        return data


class FieldAssistTurn(BaseModel):
    question: str = Field(..., min_length=1, max_length=1000)
    answer: str = Field("", max_length=5000)


MAX_ASSIST_TURNS = 5


class FieldQuestionRequest(BaseModel):
    field_id: str = Field(..., pattern=FIELD_ID_PATTERN)
    history: list[FieldAssistTurn] = Field(default_factory=list, max_length=MAX_ASSIST_TURNS)


class FieldQuestionResponse(BaseModel):
    question: Optional[str] = None
    done: bool


class FieldDraftRequest(BaseModel):
    field_id: str = Field(..., pattern=FIELD_ID_PATTERN)
    history: list[FieldAssistTurn] = Field(default_factory=list, max_length=MAX_ASSIST_TURNS)


class FieldDraftResponse(BaseModel):
    value: str


class LLMCallField(BaseModel):
    label: str = Field(..., min_length=1, max_length=300)
    section: Optional[str] = ""
    help: Optional[str] = ""
    type: FieldType = FieldType.LONG_TEXT
    required: bool = False
    max_chars: Optional[int] = Field(None, ge=1, le=MAX_ANSWER_CHARS)


class LLMCallFieldsOutput(BaseModel):
    fields: list[LLMCallField] = Field(..., min_length=1, max_length=MAX_CALL_FIELDS)


class LLMPrefillOutput(BaseModel):
    answers: dict[str, Optional[str]] = Field(default_factory=dict)


class LLMFieldQuestionOutput(BaseModel):
    question: Optional[str] = None


class LLMFieldDraftOutput(BaseModel):
    value: str = ""
