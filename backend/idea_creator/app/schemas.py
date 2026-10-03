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


# ---------- Projects ----------


class ProjectCreate(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)

    tytul: str = Field(..., min_length=1, max_length=200)
    opis: str = Field(..., min_length=1)
    innowacyjnosc: str = Field(..., min_length=1)
    odbiorcy: str = Field(..., min_length=1)
    etap: Stage
    category: Optional[str] = None

    @field_validator("category", mode="before")
    @classmethod
    def blank_category_to_none(cls, value):
        return _empty_to_none(value)


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
    created_at: Optional[str] = None

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
