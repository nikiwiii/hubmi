from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any

class ChatMessage(BaseModel):
    role: str = Field(..., description="Rola: user, assistant, system")
    content: str = Field(..., description="Treść wiadomości")

class MatchRequest(BaseModel):
    message: str = Field(..., min_length=2, description="Zapytanie użytkownika opisujące problem, którego dotyczy poszukiwanie innowacji")
    category: Optional[str] = Field(None, description="Kategoria wyzwania (np. samotność, opieka nad seniorem, wykluczenie transportowe)")
    powiat: Optional[str] = Field(None, description="Powiat małopolski (np. powiat tarnowski, krakowski, nowosądecki)")
    reporter_type: Optional[str] = Field("Mieszkaniec", description="Typ zgłaszającego: Senior, Opiekun, Mieszkaniec, Pracownik socjalny")
    conversation_history: Optional[List[ChatMessage]] = Field(default=[], description="Historia konwersacji chatbota")
    user_id: Optional[str] = Field(None, description="Identyfikator zalogowanego użytkownika (jeśli dostępny)")

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

class CommunityIdeaMatch(BaseModel):
    id: str
    title: str
    description: str
    category: Optional[str] = None
    author_name: Optional[str] = None
    url: str
    similarity_percentage: Optional[str] = None

class SimilarProblemMatch(BaseModel):
    id: str
    problem_text: str
    powiat: Optional[str] = None
    category: Optional[str] = None
    reporter_type: Optional[str] = None
    status: str
    created_at: Optional[str] = None

class MatchedExpert(BaseModel):
    name: str
    title: str
    department: str
    specialization: str
    chat_topic: str
    chat_url: str

class NextActionItem(BaseModel):
    action_id: str = Field(..., description="report_problem, create_idea, chat_expert")
    title: str
    description: str
    button_label: str
    url: str
    icon_name: str
    badge: Optional[str] = None

class ExplainabilityInfo(BaseModel):
    summary: str = Field(..., description="Zrozumiałe wyjaśnienie, dlaczego dane rozwiązanie zostało wybrane")
    matched_aspects: List[str] = Field(default=[], description="Kluczowe powiązane aspekty (np. dofinansowanie, grupa docelowa, problem)")
    source_file: str = Field(..., description="Nazwa pliku źródłowego dokumentującego innowację")
    source_url: Optional[str] = Field(None, description="URL prowadzący do projektu lub dokumentacji (bez zmyślonych linków)")

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
    community_ideas: List[CommunityIdeaMatch] = Field(default=[], description="Dopasowane pomysły mieszkańców z platformy Hubmi")
    similar_problems: List[SimilarProblemMatch] = Field(default=[], description="Podobne zgłoszone problemy z innych powiatów")
    matched_expert: Optional[MatchedExpert] = Field(None, description="Rekomendowany ekspert ROPS Kraków z możliwością bezpośredniego kontaktu")
    next_actions: List[NextActionItem] = Field(default=[], description="Kolejne kroki: zgłoś problem do Hubu, stwórz w Kreatorze, napisz do eksperta")
    saved_problem_id: Optional[str] = Field(None, description="ID zapisanego w bazie zgłoszonego problemu")
    trace: List[TraceStep] = Field(default=[], description="Pełny ślad wykonania dla administratora")
    total_duration_ms: float

class InnovationCreate(BaseModel):
    title: str = Field(..., min_length=3)
    description: str = Field(..., min_length=5, description="Opis rozwiązania")
    addressed_problems: str = Field(..., min_length=5, description="Problem, na który odpowiada innowacja")
    funding_info: Optional[str] = Field(None, description="Informacje o dofinansowaniu / grantach")
    target_group: Optional[str] = Field(None, description="Grupa docelowa")
    beneficiaries: Optional[str] = Field(None, description="Beneficjenci")
    url: Optional[str] = Field(None, description="Adres URL do szczegółów lub dokumentu")
    file_source: str = Field(..., description="Nazwa pliku źródłowego")

