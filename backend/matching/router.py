from fastapi import APIRouter, Depends, status, HTTPException, Query
from typing import List, Optional
from pydantic import BaseModel, Field
from supabase_client import DatabaseRepository
from login.router import get_current_admin_payload
from matching.schemas import MatchRequest, MatchResponse, InnovationCreate
from matching.service import MatchingService
from matching.embeddings import compute_embedding

router = APIRouter(prefix="/api/matching", tags=["Matching & RAG Chatbot"])

class ReportProblemDirectRequest(BaseModel):
    problem_text: str = Field(..., min_length=5, description="Opis problemu społecznego")
    category: Optional[str] = Field(None, description="Kategoria wyzwania")
    powiat: Optional[str] = Field(None, description="Powiat małopolski")
    reporter_type: Optional[str] = Field("Mieszkaniec", description="Senior, Opiekun, Mieszkaniec, Pracownik socjalny")
    user_id: Optional[str] = None

@router.post("/chat", response_model=MatchResponse, summary="Chatbot RAG: Wielojęzyczne dopasowanie innowacji z Explainability, kolejnymi krokami i zapisem problemu")
def chat_matching(request: MatchRequest):
    """
    Główny endpoint inteligentnego dopasowania problemu:
    1. Pobiera zapytanie użytkownika (z opcjonalną kategorią, powiatem i rolą zgłaszającego).
    2. Generuje embedding wielojęzycznym modelem paraphrase-multilingual-MiniLM-L12-v2.
    3. Przeszukuje innowacje ROPS Kraków przez pgvector RPC match_innovations (oraz hybrydowy fallback).
    4. Zapisuje zgłoszenie w tabeli `reported_problems` dla Zasobnika Badań Społecznych.
    5. Wzbogaca wyniki o powiązane pomysły mieszkańców (społeczność) oraz dedykowanego eksperta ROPS.
    6. Jeśli nie znaleziono rozwiązania, nie kończy ślepą uliczką – oferuje interaktywne kolejne kroki (Kreator Pomysłów, czat z ekspertem).
    """
    return MatchingService.match_and_chat(request)

@router.post("/match", response_model=MatchResponse, summary="Szybkie dopasowanie problemu (alias chatbota)")
def direct_match(request: MatchRequest):
    """Alias dla endpointu /chat."""
    return MatchingService.match_and_chat(request)

@router.get("/reported-problems", summary="Lista zgłoszonych problemów społecznych (dla Zasobnika i agregacji trendów)")
def get_reported_problems(limit: int = Query(50, ge=1, le=200)):
    """Zwraca ostatnie zgłoszenia problemów z podziałem na kategorie i powiaty."""
    return DatabaseRepository.get_reported_problems(limit=limit)

@router.post("/report-problem", status_code=status.HTTP_201_CREATED, summary="Zgłoś problem do bazy wyzwań regionu")
def report_problem_directly(data: ReportProblemDirectRequest):
    """Pozwala seniorowi lub mieszkańcowi zgłosić problem do Bazy Potrzeb Regionu."""
    vec = compute_embedding(data.problem_text)
    formatted_desc = f"[Kategoria: {data.category or 'Ogólna'} | Powiat: {data.powiat or 'Małopolska'} | Zgłaszający: {data.reporter_type}] {data.problem_text}"
    saved = DatabaseRepository.save_reported_problem({
        "user_id": data.user_id,
        "problem_description": formatted_desc,
        "embedding": vec,
        "status": "needs_solution",
    })
    return {"success": True, "message": "Zgłoszenie zostało pomyślnie zarejestrowane w Bazie Potrzeb Regionu.", "data": saved}

@router.get("/innovations", summary="Lista wszystkich innowacji w bazie danych")
def get_innovations(include_embedding: bool = False):
    """Zwraca bazę innowacji wraz ze wszystkimi informacjami."""
    innovations = DatabaseRepository.get_all_innovations()
    sanitized = []
    for item in innovations:
        d = dict(item)
        if not include_embedding and "embedding" in d:
            if isinstance(d["embedding"], list):
                d["embedding_dim"] = len(d["embedding"])
            d.pop("embedding", None)
        sanitized.append(d)
    return sanitized

@router.post("/innovations", status_code=status.HTTP_201_CREATED, summary="Dodaj nową innowację do bazy danych (tylko administrator)")
def add_innovation(
    data: InnovationCreate,
    admin_payload: dict = Depends(get_current_admin_payload)
):
    """Pozwala dodać nową innowację do bazy (wymaga uprawnień administratora)."""
    text_to_embed = f"{data.title}. Problem: {data.addressed_problems}. Opis: {data.description}. Dofinansowanie: {data.funding_info or ''}"
    embedding = compute_embedding(text_to_embed)

    new_item = {
        "title": data.title,
        "description": data.description,
        "addressed_problems": data.addressed_problems,
        "funding_info": data.funding_info,
        "target_group": data.target_group,
        "beneficiaries": data.beneficiaries,
        "url": data.url,
        "file_source": data.file_source,
        "embedding": embedding
    }
    created = DatabaseRepository.create_innovation(new_item)
    created_copy = dict(created)
    created_copy.pop("embedding", None)
    return created_copy

