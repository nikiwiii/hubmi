import base64
import binascii
import re
from enum import Enum
from typing import Literal, Optional

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
