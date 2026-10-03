import os
import json
import time
import logging
from typing import Dict, Any, Optional
from pathlib import Path
from fastapi import APIRouter, HTTPException, Query
from supabase_client import supabase_client, is_supabase_connected

logger = logging.getLogger("hubmi.indicators")

router = APIRouter(prefix="/api/indicators", tags=["Indicators (Zasobnik Badań Społecznych)"])

# In-memory cache
_CACHE_DATA: Optional[Dict[str, Any]] = None
_CACHE_TIMESTAMP: float = 0
CACHE_TTL_SECONDS: int = 30  # 30 sekund cache'owania w pamięci


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


def fetch_indicators_from_supabase() -> Dict[str, Any]:
    """Pobiera wszystkie wskaźniki i ich pomiary bezpośrednio z Supabase."""
    if not is_supabase_connected or not supabase_client:
        logger.info("Supabase nie jest połączone - używam lokalnego fallbacku.")
        return _load_local_fallback()

    try:
        # 1. Pobierz definicje wskaźników
        r_ind = supabase_client.table("indicators").select("*").execute()
        indicators = r_ind.data or []

        if not indicators:
            logger.warning("Tabela indicators w Supabase jest pusta - używam lokalnego fallbacku.")
            return _load_local_fallback()

        result: Dict[str, Any] = {}
        for ind in indicators:
            ind_id = ind.get("id")
            if not ind_id:
                continue
            result[ind_id] = {
                "name": ind.get("name", ind_id),
                "unit": ind.get("unit", ""),
                "description": ind.get("description", ""),
                "years": [],
                "dane_powiaty": {},
            }

        # 2. Pobierz pomiary partiami (obsługa limitu PostgREST 1000 wierszy)
        measurements = []
        offset = 0
        batch_size = 1000

        while True:
            r_meas = (
                supabase_client.table("indicator_measurements")
                .select("indicator_id, powiat_name, year, val")
                .range(offset, offset + batch_size - 1)
                .execute()
            )
            batch = r_meas.data or []
            measurements.extend(batch)
            if len(batch) < batch_size:
                break
            offset += batch_size

        logger.info(f"Pobrano {len(indicators)} wskaźników i {len(measurements)} pomiarów z Supabase.")

        # 3. Zbuduj strukturę powiatów i lat
        for m in measurements:
            ind_id = m.get("indicator_id")
            powiat = m.get("powiat_name")
            yr = str(m.get("year"))
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


@router.get("", summary="Pobierz wszystkie diagnozy i pomiary dla powiatów")
@router.get("/", summary="Pobierz wszystkie diagnozy i pomiary dla powiatów (ze slashem)")
def get_indicators(force_refresh: bool = Query(False, description="Wymuś odświeżenie danych pomijając cache")):
    global _CACHE_DATA, _CACHE_TIMESTAMP

    now = time.time()
    if force_refresh or _CACHE_DATA is None or (now - _CACHE_TIMESTAMP > CACHE_TTL_SECONDS):
        _CACHE_DATA = fetch_indicators_from_supabase()
        _CACHE_TIMESTAMP = now

    return {
        "success": True,
        "count": len(_CACHE_DATA),
        "source": "supabase" if is_supabase_connected else "local_json",
        "data": _CACHE_DATA
    }


@router.post("/refresh", summary="Wyczyść cache wskaźników")
def refresh_indicators_cache():
    global _CACHE_DATA, _CACHE_TIMESTAMP
    _CACHE_DATA = None
    _CACHE_TIMESTAMP = 0
    return {"success": True, "message": "Cache wskaźników został wyczyszczony."}
