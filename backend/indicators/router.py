import os
import json
import time
import logging
from typing import Dict, Any, Optional, List
from pathlib import Path
from fastapi import APIRouter, HTTPException, Query
from supabase_client import supabase_client, is_supabase_connected

from scraper_rops import CATEGORY_METADATA

logger = logging.getLogger("hubmi.indicators")

router = APIRouter(prefix="/api/indicators", tags=["Indicators (Zasobnik Badań Społecznych)"])

# In-memory cache
_CACHE_DATA: Optional[Dict[str, Any]] = None
_CACHE_TIMESTAMP: float = 0
_CACHE_CATEGORIES: Optional[List[Dict[str, Any]]] = None
CACHE_TTL_SECONDS: int = 30  # 30 sekund cache'owania w pamięci


def _as_dict_list(data: Any) -> List[Dict[str, Any]]:
    """Pomocnik rzutowania odpowiedzi PostgREST na listę słowników."""
    if isinstance(data, list):
        return [dict(x) for x in data if isinstance(x, dict)]
    return []


def _load_local_fallback() -> Dict[str, Any]:
    """Wczytuje lokalny plik visualize_data.json jako fallback."""
    json_path = Path(__file__).resolve().parent.parent / "visualize_data.json"
    if json_path.exists():
        try:
            with open(json_path, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception as e:
            logger.error(f"Błąd odczytu lokalnego pliku {json_path}: {e}")
    return {}


def _load_local_categories_fallback() -> List[Dict[str, Any]]:
    """Wczytuje lokalny plik indicator_categories.json lub metadane domyślne."""
    cat_json = Path(__file__).resolve().parent.parent / "indicator_categories.json"
    if cat_json.exists():
        try:
            with open(cat_json, "r", encoding="utf-8") as f:
                data = json.load(f)
                if isinstance(data, list) and data:
                    return data
        except Exception:
            pass

    # Fallback ze słownika CATEGORY_METADATA
    return [
        {
            "id": cat_id,
            "name": meta["name"],
            "description": meta.get("description", ""),
            "color": meta.get("color", "#698B99"),
            "icon": meta.get("icon", "activity"),
            "sort_order": meta.get("sort_order", idx + 1),
        }
        for idx, (cat_id, meta) in enumerate(CATEGORY_METADATA.items())
    ]


def fetch_categories_from_supabase() -> List[Dict[str, Any]]:
    """Pobiera listę kategorii wraz z kolorami z bazy Supabase lub fallbacku."""
    if not is_supabase_connected or not supabase_client:
        return _load_local_categories_fallback()

    try:
        res = supabase_client.table("indicator_categories").select("*").order("sort_order").execute()
        categories = _as_dict_list(res.data)
        if not categories:
            return _load_local_categories_fallback()

        # Uzupełnij kolor z CATEGORY_METADATA jeśli brak w kolumnach
        for cat in categories:
            cid = str(cat.get("id") or "")
            meta = CATEGORY_METADATA.get(cid, {})
            if not cat.get("color"):
                cat["color"] = meta.get("color", "#698B99")
            if not cat.get("icon"):
                cat["icon"] = meta.get("icon", "activity")
        return categories
    except Exception as e:
        logger.error(f"Błąd pobierania kategorii z Supabase: {e}")
        return _load_local_categories_fallback()


def fetch_indicators_from_supabase() -> Dict[str, Any]:
    """Pobiera wszystkie wskaźniki i ich pomiary bezpośrednio z Supabase."""
    if not is_supabase_connected or not supabase_client:
        logger.info("Supabase nie jest połączone - używam lokalnego fallbacku.")
        return _load_local_fallback()

    try:
        # 1. Pobierz definicje wskaźników
        r_ind = supabase_client.table("indicators").select("*").execute()
        indicators = _as_dict_list(r_ind.data)

        if not indicators:
            logger.warning("Tabela indicators w Supabase jest pusta - używam lokalnego fallbacku.")
            return _load_local_fallback()

        # Pobierz mapę kategorii (dla kolorów i nazw)
        categories = fetch_categories_from_supabase()
        cat_map: Dict[str, Dict[str, Any]] = {str(c.get("id") or ""): c for c in categories}

        result: Dict[str, Any] = {}
        for ind in indicators:
            ind_id = str(ind.get("id") or "")
            if not ind_id:
                continue
            cat_id = str(ind.get("category_id") or "")
            cat_obj = cat_map.get(cat_id, {})
            result[ind_id] = {
                "name": ind.get("name", ind_id),
                "unit": ind.get("unit", ""),
                "description": ind.get("description", ""),
                "category_id": cat_id,
                "category": cat_obj.get("name", cat_id or "Ogólne"),
                "color": cat_obj.get("color", "#698B99"),
                "years": [],
                "dane_powiaty": {},
            }

        # 2. Pobierz pomiary partiami (obsługa limitu PostgREST 1000 wierszy)
        measurements: List[Dict[str, Any]] = []
        offset = 0
        batch_size = 1000

        while True:
            r_meas = (
                supabase_client.table("indicator_measurements")
                .select("indicator_id, powiat_name, year, val")
                .range(offset, offset + batch_size - 1)
                .execute()
            )
            batch = _as_dict_list(r_meas.data)
            measurements.extend(batch)
            if len(batch) < batch_size:
                break
            offset += batch_size

        logger.info(f"Pobrano {len(indicators)} wskaźników i {len(measurements)} pomiarów z Supabase.")

        # 3. Zbuduj strukturę powiatów i lat
        for m in measurements:
            ind_id = str(m.get("indicator_id") or "")
            powiat = str(m.get("powiat_name") or "")
            yr = str(m.get("year") or "")
            try:
                val = float(m.get("val", 0.0))
            except (ValueError, TypeError):
                val = 0.0

            if ind_id in result and powiat:
                if powiat not in result[ind_id]["dane_powiaty"]:
                    result[ind_id]["dane_powiaty"][powiat] = {}
                result[ind_id]["dane_powiaty"][powiat][yr] = val

        # 4. Wyznacz posortowane lata dla każdego wskaźnika
        for ind_id, ind_obj in result.items():
            years_set = set()
            for p_dict in ind_obj["dane_powiaty"].values():
                years_set.update(p_dict.keys())
            ind_obj["years"] = sorted(list(years_set), key=lambda y: int(y) if y.isdigit() else y)

        return result

    except Exception as e:
        logger.error(f"Błąd podczas pobierania danych wskaźników z Supabase: {e}")
        return _load_local_fallback()


@router.get("/categories", summary="Pobierz kategorie wskaźników z kolorami i ikonami")
def get_categories():
    global _CACHE_CATEGORIES
    if _CACHE_CATEGORIES is None:
        _CACHE_CATEGORIES = fetch_categories_from_supabase()

    cats = _CACHE_CATEGORIES or []
    return {
        "success": True,
        "count": len(cats),
        "data": cats,
    }


@router.get("", summary="Pobierz wszystkie diagnozy i pomiary dla powiatów")
@router.get("/", summary="Pobierz wszystkie diagnozy i pomiary dla powiatów (ze slashem)")
def get_indicators(force_refresh: bool = Query(False, description="Wymuś odświeżenie danych pomijając cache")):
    global _CACHE_DATA, _CACHE_TIMESTAMP, _CACHE_CATEGORIES

    now = time.time()
    if force_refresh or _CACHE_DATA is None or (now - _CACHE_TIMESTAMP > CACHE_TTL_SECONDS):
        _CACHE_DATA = fetch_indicators_from_supabase()
        _CACHE_CATEGORIES = fetch_categories_from_supabase()
        _CACHE_TIMESTAMP = now

    return {
        "success": True,
        "count": len(_CACHE_DATA),
        "source": "supabase" if is_supabase_connected else "local_json",
        "data": _CACHE_DATA,
    }


@router.post("/refresh", summary="Wyczyść cache wskaźników")
def refresh_indicators_cache():
    global _CACHE_DATA, _CACHE_TIMESTAMP, _CACHE_CATEGORIES
    _CACHE_DATA = None
    _CACHE_CATEGORIES = None
    _CACHE_TIMESTAMP = 0
    return {"success": True, "message": "Cache wskaźników został wyczyszczony."}


from pydantic import BaseModel, Field
from indicators.rag_service import KnowledgeRagService

class IndicatorsRagRequest(BaseModel):
    query: str = Field(..., min_length=2, description="Zapytanie analityczne, np. 'osoby na wózkach w powiecie krakowskim'")
    powiat_id: Optional[str] = Field(None, description="Opcjonalny identyfikator powiatu do zawężenia analizy")

@router.post("/rag", summary="RAG Raportów i Wskaźników: Inteligentne dopasowanie badań, wykresów powiatowych i synteza AI")
def query_indicators_rag(req: IndicatorsRagRequest):
    """
    Punkt wejścia dla RAG Raportów Społecznych:
    - Rozpoznaje powiat (np. Powiat Krakowski) i tematykę (np. niepełnosprawność ruchowa, wózki).
    - Zwraca dokładne dane liczbowe, pozycję w regionie, serie czasowe do wykresów oraz syntezę analityczną AI.
    - Wzbogaca wyniki o powiązane innowacje z bazy ROPS Kraków.
    """
    try:
        result = KnowledgeRagService.execute_rag(
            query=req.query,
            preferred_powiat_id=req.powiat_id
        )
        return result
    except Exception as e:
        logger.error(f"Błąd podczas wykonywania RAG wskaźników: {e}")
        raise HTTPException(status_code=500, detail=f"Błąd przetwarzania zapytania analitycznego: {str(e)}")
