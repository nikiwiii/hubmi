import json
import logging
from typing import List, Dict, Any, Optional
from fastapi import APIRouter, HTTPException, Query, status
from pydantic import BaseModel, Field
from supabase_client import DatabaseRepository
from matching.embeddings import compute_embedding

logger = logging.getLogger("hubmi.innovations")

router = APIRouter(prefix="/api/innovations", tags=["Innovations (Baza Innowacji Społecznych)"])


class InnovationCreatePayload(BaseModel):
    title: str = Field(..., min_length=3, description="Tytuł innowacji")
    description: str = Field(..., min_length=5, description="Szczegółowy opis rozwiązania")
    addressed_problems: str = Field(..., min_length=5, description="Rozwiązywane problemy społeczne")
    target_group: Optional[str] = Field(None, description="Grupa docelowa")
    beneficiaries: Optional[str] = Field(None, description="Odbiorcy / beneficjenci")
    validation: Optional[str] = Field(None, description="Walidacja i rezultaty")
    authors: Optional[str] = Field(None, description="Autorzy / pomysłodawcy")
    funding_info: Optional[str] = Field(None, description="Informacje o dofinansowaniu")
    url: Optional[str] = Field(None, description="Link do projektu źródłowego w ROPS Kraków")
    video_url: Optional[str] = Field(None, description="Link do filmu na YouTube (NULLABLE)")
    file_source: Optional[str] = Field(None, description="Plik źródłowy")
    category: Optional[str] = Field(None, description="Kategoria innowacji")


class InnovationUpdatePayload(BaseModel):
    title: Optional[str] = Field(None, description="Tytuł innowacji")
    description: Optional[str] = Field(None, description="Szczegółowy opis rozwiązania")
    addressed_problems: Optional[str] = Field(None, description="Rozwiązywane problemy społeczne")
    target_group: Optional[str] = Field(None, description="Grupa docelowa")
    beneficiaries: Optional[str] = Field(None, description="Odbiorcy / beneficjenci")
    validation: Optional[str] = Field(None, description="Walidacja i rezultaty")
    authors: Optional[str] = Field(None, description="Autorzy / pomysłodawcy")
    funding_info: Optional[str] = Field(None, description="Informacje o dofinansowaniu")
    url: Optional[str] = Field(None, description="Link do projektu źródłowego")
    video_url: Optional[str] = Field(None, description="Link do filmu na YouTube (NULLABLE)")
    file_source: Optional[str] = Field(None, description="Plik źródłowy")
    category: Optional[str] = Field(None, description="Kategoria innowacji")


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

    # Upewnij się, że pole video_url występuje w rekordzie wyjściowym
    if "video_url" not in record:
        record["video_url"] = None
            
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
    - video_url (link do filmiku YouTube, jeśli dostępny)
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


VALID_INNOVATION_COLUMNS = {
    "title", "description", "addressed_problems", "target_group",
    "beneficiaries", "validation", "authors", "funding_info",
    "url", "video_url", "file_source"
}


@router.post("", status_code=status.HTTP_201_CREATED, summary="Dodaj nową innowację społeczną do bazy (z polem video_url)")
@router.post("/", status_code=status.HTTP_201_CREATED, summary="Dodaj nową innowację społeczną do bazy (ze slashem)")
def create_innovation_endpoint(data: InnovationCreatePayload):
    """Tworzy nowy rekord innowacji w bazie danych z uwzględnieniem opcjonalnego linku do YouTube (video_url)."""
    text_to_embed = f"{data.title}. Problem: {data.addressed_problems}. Opis: {data.description}. Dofinansowanie: {data.funding_info or ''}"
    embedding = compute_embedding(text_to_embed)

    new_item = {
        "title": data.title,
        "description": data.description,
        "addressed_problems": data.addressed_problems,
        "target_group": data.target_group,
        "beneficiaries": data.beneficiaries,
        "validation": data.validation,
        "authors": data.authors,
        "funding_info": data.funding_info,
        "url": data.url,
        "video_url": data.video_url,
        "file_source": data.file_source,
        "embedding": embedding
    }
    created = DatabaseRepository.create_innovation(new_item)
    return format_innovation_record(created)


@router.put("/{innovation_id}", summary="Zaktualizuj innowację społeczną (np. link do filmu YouTube video_url)")
@router.patch("/{innovation_id}", summary="Częściowo zaktualizuj innowację społeczną (np. video_url)")
def update_innovation_endpoint(innovation_id: str, data: InnovationUpdatePayload):
    """Aktualizuje pola innowacji w bazie danych, w tym video_url."""
    existing = DatabaseRepository.get_innovation_by_id(innovation_id)
    if not existing:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Innowacja o identyfikatorze '{innovation_id}' nie została znaleziona w bazie danych."
        )

    updates = {k: v for k, v in data.model_dump(exclude_unset=True).items() if k in VALID_INNOVATION_COLUMNS}
    if not updates:
        return format_innovation_record(existing)

    # Jeśli zmieniono pola tekstowe kluczowe dla semantyki, przelicz wektor embeddingu
    if any(k in updates for k in ("title", "description", "addressed_problems", "funding_info")):
        new_title = updates.get("title", existing.get("title", ""))
        new_desc = updates.get("description", existing.get("description", ""))
        new_prob = updates.get("addressed_problems", existing.get("addressed_problems", ""))
        new_fund = updates.get("funding_info", existing.get("funding_info", ""))
        text_to_embed = f"{new_title}. Problem: {new_prob}. Opis: {new_desc}. Dofinansowanie: {new_fund or ''}"
        updates["embedding"] = compute_embedding(text_to_embed)

    updated = DatabaseRepository.update_innovation(innovation_id, updates)
    return format_innovation_record(updated or {**existing, **updates})

