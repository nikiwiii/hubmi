import json
import logging
from typing import List, Dict, Any, Optional
from fastapi import APIRouter, HTTPException, Query, status
from supabase_client import DatabaseRepository

logger = logging.getLogger("hubmi.innovations")

router = APIRouter(prefix="/api/innovations", tags=["Innovations (Baza Innowacji Społecznych)"])

def format_innovation_record(item: Dict[str, Any], include_embedding: bool = False) -> Dict[str, Any]:
    """Formatowanie i sanityzacja rekordu innowacji dla wyjścia JSON."""
    record = dict(item)
    emb = record.get("embedding")
    
    if emb is not None:
        parsed_emb = None
        if isinstance(emb, list):
            parsed_emb = emb
        elif isinstance(emb, str):
            try:
                parsed_emb = json.loads(emb)
            except Exception:
                parsed_emb = emb
        
        if include_embedding:
            record["embedding"] = parsed_emb
        else:
            if isinstance(parsed_emb, list):
                record["embedding_dim"] = len(parsed_emb)
            record.pop("embedding", None)
            
    return record


@router.get("", summary="Pobierz wszystkie informacje z innowacji jako JSON")
@router.get("/", summary="Pobierz wszystkie informacje z innowacji jako JSON (ze slashem)")
def get_all_innovations(
    include_embedding: bool = Query(
        False, 
        description="Czy dołączyć pełny wektor embeddingu (domyślnie false dla oszczędności transferu)"
    ),
    search: Optional[str] = Query(
        None, 
        description="Filtruj innowacje po tytule, opisie lub problemie"
    ),
    limit: Optional[int] = Query(
        None, 
        description="Maksymalna liczba rekordów do zwrócenia"
    ),
    offset: int = Query(
        0, 
        ge=0, 
        description="Przesunięcie paginacji"
    )
):
    """
    Zwraca wszystkie dostępne informacje o innowacjach społecznych w formacie JSON:
    - id
    - title (tytuł innowacji)
    - description (szczegółowy opis)
    - addressed_problems (rozwiązywane problemy)
    - target_group (grupa docelowa)
    - beneficiaries (odbiorcy / beneficjenci)
    - validation (walidacja i rezultaty)
    - authors (autorzy / pomysłodawcy)
    - funding_info (informacje o dofinansowaniu)
    - url (link do projektu źródłowego w ROPS Kraków)
    - file_source (plik źródłowy)
    - category (kategoria)
    - created_at (data utworzenia)
    - embedding (opcjonalny wektor embeddingu, jeśli include_embedding=true)
    """
    raw_innovations = DatabaseRepository.get_all_innovations()
    
    # Filtrowanie po tekście jeśli podano search
    if search:
        s_lower = search.strip().lower()
        raw_innovations = [
            item for item in raw_innovations
            if s_lower in str(item.get("title", "")).lower()
            or s_lower in str(item.get("description", "")).lower()
            or s_lower in str(item.get("addressed_problems", item.get("addresed_problems", ""))).lower()
        ]

    # Paginacja
    if offset > 0:
        raw_innovations = raw_innovations[offset:]
    if limit is not None and limit > 0:
        raw_innovations = raw_innovations[:limit]

    formatted = [format_innovation_record(item, include_embedding=include_embedding) for item in raw_innovations]
    return formatted


@router.get("/all", summary="Pełny zrzut wszystkich danych innowacji włącznie z embeddingami")
def get_all_innovations_complete():
    """Zwraca absolutnie wszystkie informacje o innowacjach z bazy danych wraz z wektorami embeddingów."""
    raw_innovations = DatabaseRepository.get_all_innovations()
    return [format_innovation_record(item, include_embedding=True) for item in raw_innovations]


@router.get("/{innovation_id}", summary="Pobierz szczegółowe informacje o pojedynczej innowacji po ID")
def get_single_innovation(
    innovation_id: str,
    include_embedding: bool = Query(False, description="Czy dołączyć wektor embeddingu")
):
    """Zwraca wszystkie szczegółowe informacje o wybranej innowacji na podstawie jej identyfikatora UUID."""
    item = DatabaseRepository.get_innovation_by_id(innovation_id)
    if not item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Innowacja o identyfikatorze '{innovation_id}' nie została znaleziona w bazie danych."
        )
    return format_innovation_record(item, include_embedding=include_embedding)
