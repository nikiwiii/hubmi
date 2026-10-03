import json
import logging
import os
import sys
import io
from pathlib import Path
from dotenv import load_dotenv
import requests

# Wymuszenie kodowania UTF-8 dla konsoli Windows
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8")

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("seed_indicators")

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL", "").strip().rstrip("/")
if SUPABASE_URL.endswith("/rest/v1"):
    SUPABASE_URL = SUPABASE_URL[:-len("/rest/v1")]
SUPABASE_KEY = os.getenv("SUPABASE_KEY", "").strip()

if not SUPABASE_URL or not SUPABASE_KEY:
    logger.error("Brak skonfigurowanych zmiennych SUPABASE_URL i SUPABASE_KEY w pliku .env!")
    sys.exit(1)

REST_URL = f"{SUPABASE_URL}/rest/v1"
HEADERS = {
    "apikey": SUPABASE_KEY,
    "Authorization": f"Bearer {SUPABASE_KEY}",
    "Content-Type": "application/json",
    "Prefer": "resolution=merge-duplicates"
}

def seed_indicators():
    json_path = Path(__file__).parent / "visualize_data.json"
    if not json_path.exists():
        logger.error(f"Nie znaleziono pliku: {json_path}")
        sys.exit(1)

    logger.info(f"Wczytywanie danych z pliku: {json_path}")
    with open(json_path, "r", encoding="utf-8") as f:
        data = json.load(f)

    logger.info(f"Znaleziono {len(data)} wskaźników do zaimportowania: {list(data.keys())}")

    total_measurements_inserted = 0

    for ind_id, ind_info in data.items():
        name = ind_info.get("name", ind_id)
        unit = ind_info.get("unit", "")
        description = ind_info.get("description", "")

        logger.info(f"--- Przetwarzanie wskaźnika: '{ind_id}' ({name}) ---")

        # 1. Zapis / Upsert wskaźnika do tabeli 'indicators'
        ind_payload = {
            "id": ind_id,
            "name": name,
            "unit": unit,
            "description": description
        }

        r_ind = requests.post(
            f"{REST_URL}/indicators",
            headers=HEADERS,
            json=ind_payload
        )

        if r_ind.status_code not in (200, 201):
            logger.error(f"Błąd zapisu wskaźnika '{ind_id}': {r_ind.status_code} - {r_ind.text}")
        else:
            logger.info(f"  ✓ Zapisano wskaźnik: {name}")

        # 2. Przygotowanie serii pomiarów dla każdego powiatu i roku
        dane_powiaty = ind_info.get("dane_powiaty", {})
        measurements = []

        for powiat, yearly_data in dane_powiaty.items():
            for yr, val in yearly_data.items():
                try:
                    num_val = float(val)
                except (ValueError, TypeError):
                    num_val = 0.0

                measurements.append({
                    "indicator_id": ind_id,
                    "powiat_name": powiat,
                    "year": int(yr),
                    "val": num_val
                })

        logger.info(f"  Przygotowano {len(measurements)} punktów pomiarowych dla wskaźnika '{ind_id}'...")

        # 3. Zapis partiami (batch) do tabeli 'indicator_measurements'
        batch_size = 200
        ind_inserted = 0
        for i in range(0, len(measurements), batch_size):
            batch = measurements[i:i + batch_size]
            r_meas = requests.post(
                f"{REST_URL}/indicator_measurements",
                headers=HEADERS,
                json=batch
            )
            if r_meas.status_code not in (200, 201):
                logger.error(f"  Błąd wstawiania partii pomiarów: {r_meas.status_code} - {r_meas.text}")
            else:
                ind_inserted += len(batch)

        logger.info(f"  ✓ Zaimportowano {ind_inserted} pomiarów dla wskaźnika '{ind_id}'.")
        total_measurements_inserted += ind_inserted

    # 4. Weryfikacja liczby rekordów w Supabase
    r_check_ind = requests.get(f"{REST_URL}/indicators?select=count", headers={
        "apikey": SUPABASE_KEY,
        "Authorization": f"Bearer {SUPABASE_KEY}",
        "Range-Unit": "items",
        "Prefer": "count=exact"
    })
    r_check_meas = requests.get(f"{REST_URL}/indicator_measurements?select=count", headers={
        "apikey": SUPABASE_KEY,
        "Authorization": f"Bearer {SUPABASE_KEY}",
        "Range-Unit": "items",
        "Prefer": "count=exact"
    })

    ind_count = r_check_ind.headers.get("content-range", "").split("/")[-1] or "N/A"
    meas_count = r_check_meas.headers.get("content-range", "").split("/")[-1] or "N/A"

    logger.info("=" * 60)
    logger.info("PODSUMOWANIE IMPORTU DO SUPABASE:")
    logger.info(f"Łączna liczba wskaźników w tabeli 'indicators': {ind_count}")
    logger.info(f"Łączna liczba punktów pomiarowych w 'indicator_measurements': {meas_count}")
    logger.info("=" * 60)
    logger.info("Import zakończony pełnym sukcesem!")

if __name__ == "__main__":
    seed_indicators()
