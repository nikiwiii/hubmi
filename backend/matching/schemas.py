from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any

class ChatMessage(BaseModel):
    role: str = Field(..., description="Rola: user, assistant, system")
    content: str = Field(..., description="Treść wiadomości")

class MatchRequest(BaseModel):
    message: str = Field(..., min_length=2, description="Zapytanie użytkownika opisujące problem, którego dotyczy poszukiwanie innowacji")
    conversation_history: Optional[List[ChatMessage]] = Field(default=[], description="Historia konwersacji chatbota")

class InnovationMatchItem(BaseModel):
    id: str
    title: str
    problem_statement: str
    solution: str
    funding_info: Optional[str] = None
    target_group: Optional[str] = None
    url: Optional[str] = None
    file_source: Optional[str] = None
    similarity: float
    similarity_percentage: str
    is_top_match: bool = False
    is_close_match: bool = False

class ExplainabilityInfo(BaseModel):
    summary: str = Field(..., description="Zrozumiałe wyjaśnienie, dlaczego dane rozwiązanie zostało wybrane")
    matched_aspects: List[str] = Field(default=[], description="Kluczowe powiązane aspekty (np. dofinansowanie, grupa docelowa, problem)")
    source_file: str = Field(..., description="Nazwa pliku źródłowego dokumentującego innowację")
    source_url: str = Field(..., description="URL prowadzący bezpośrednio do projektu / dokumentacji")

class TraceStep(BaseModel):
    step_number: int
    name: str
    status: str
    duration_ms: float
    details: Dict[str, Any]

class MatchResponse(BaseModel):
    answer: str = Field(..., description="Odpowiedź chatbota w języku polskim")
    guardrail_status: str = Field(..., description="Status filtrów ochronnych: PASSED, BLOCKED_OFF_TOPIC, BLOCKED_NOT_FOUND")
    guardrail_message: Optional[str] = None
    top_solution: Optional[InnovationMatchItem] = None
    close_solutions: List[InnovationMatchItem] = Field(default=[], description="Do 2 innych rozwiązań z podobieństwem mieszczącym się w 5% od najlepszego")
    explainability: Optional[ExplainabilityInfo] = None
    trace: List[TraceStep] = Field(default=[], description="Pełny ślad wykonania (tracing krok po kroku)")
    total_duration_ms: float

class InnovationCreate(BaseModel):
    title: str = Field(..., min_length=3)
    description: str = Field(..., min_length=5, description="Opis rozwiązania")
    addressed_problems: str = Field(..., min_length=5, description="Problem, na który odpowiada innowacja")
    funding_info: Optional[str] = Field(None, description="Informacje o dofinansowaniu / grantach")
    target_group: Optional[str] = Field(None, description="Grupa docelowa")
    beneficiaries: Optional[str] = Field(None, description="Beneficjenci")
    url: str = Field(..., description="Adres URL do szczegółów lub dokumentu")
    file_source: str = Field(..., description="Nazwa pliku źródłowego")
