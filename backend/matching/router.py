from fastapi import APIRouter, Depends, status, HTTPException
from typing import List
from supabase_client import DatabaseRepository
from login.router import get_current_admin_payload
from matching.schemas import MatchRequest, MatchResponse, InnovationCreate
from matching.service import MatchingService
from matching.embeddings import compute_embedding

router = APIRouter(prefix="/api/matching", tags=["Matching & RAG Chatbot"])

@router.post("/chat", response_model=MatchResponse, summary="Chatbot RAG: Wyszukiwanie innowacji po problemie z Groq API, Explainability i Tracingiem")
def chat_matching(request: MatchRequest):
    """
    Główny endpoint chatbota dopasowującego innowacje:
    1. Pobiera zapytanie użytkownika opisujące problem.
    2. Wyszukuje semantycznie (vector search po embeddingu) najtrafniejsze innowacje w bazie `innovations`.
    3. Railway / Guardrails:
       - Jeżeli pytanie jest niepowiązane lub nie ma w bazie takiego projektu -> zwraca komunikat odmowy z informacją guardrails.
    4. Identyfikuje najlepsze rozwiązanie oraz do 2 innych zbliżonych rozwiązań z podobieństwem w granicy do 5%.
    5. Wyodrębnia Explainability (dlaczego wybrano to rozwiązanie) oraz wskazuje plik źródłowy i URL.
    6. Generuje odpowiedź za pomocą Groq API (model LLaMA 3.3).
    7. Zwraca pełny ślad wykonania (tracing krok po kroku).
    """
    return MatchingService.match_and_chat(request)

@router.post("/match", response_model=MatchResponse, summary="Szybkie dopasowanie problemu (alias chatbota)")
def direct_match(request: MatchRequest):
    """Alias dla endpointu /chat."""
    return MatchingService.match_and_chat(request)

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
    """Pozwala dodać nową innowację do bazy (wymaga uprawnień administratora) wraz z adresem URL i plikiem źródłowym."""
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
