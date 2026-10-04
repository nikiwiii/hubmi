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

# 1. Definicje 8 kategorii wskaźników
CATEGORIES_DATA = [
    {"id": "demografia", "name": "Ludność i Demografia", "description": "Struktura wiekowa, stopień urbanizacji oraz dynamika ludnościowa.", "icon": "users", "sort_order": 1},
    {"id": "rynek_pracy", "name": "Rynek Pracy i Zatrudnienie", "description": "Wskaźniki bezrobocia, aktywności zawodowej i potencjału produkcyjnego.", "icon": "briefcase", "sort_order": 2},
    {"id": "pomoc_spoleczna", "name": "Pomoc Społeczna i Ubóstwo", "description": "Wsparcie finansowe, zasiłki i obciążenie kadr socjalnych.", "icon": "banknote", "sort_order": 3},
    {"id": "niepelnosprawnosc", "name": "Niepełnosprawność i Dostępność", "description": "Wskaźniki orzecznictwa, stopień znaczny oraz pomoc środowiskowa.", "icon": "heart", "sort_order": 4},
    {"id": "zdrowie", "name": "Zdrowie i Opieka Medyczna", "description": "Dostępność placówek aptecznych, hospitalizacja i zachorowalność.", "icon": "activity", "sort_order": 5},
    {"id": "rodzina", "name": "Rodzina i Piecza Zastępcza", "description": "Rodziny zastępcze, placówki opiekuńcze i dostępność przedszkoli.", "icon": "heart", "sort_order": 6},
    {"id": "finanse", "name": "Finanse Samorządowe", "description": "Wydatki budżetów gmin i miast na prawach powiatu per capita.", "icon": "banknote", "sort_order": 7},
    {"id": "kultura", "name": "Kultura i Edukacja", "description": "Dostępność muzeów oraz infrastruktury kulturalno-edukacyjnej.", "icon": "activity", "sort_order": 8},
]

# 2. Definicje 22 powiatów Małopolski
POWIATY_DATA = [
    {"id": "bochenski", "name": "powiat bocheński", "display_name": "Powiat Bocheński", "seat": "Bochnia", "is_city": False, "subregion": "Subregion Krakowski (KOM)", "subregion_key": "kom"},
    {"id": "brzeski", "name": "powiat brzeski", "display_name": "Powiat Brzeski", "seat": "Brzesko", "is_city": False, "subregion": "Subregion Tarnowski", "subregion_key": "tarnowski"},
    {"id": "chrzanowski", "name": "powiat chrzanowski", "display_name": "Powiat Chrzanowski", "seat": "Chrzanów", "is_city": False, "subregion": "Małopolska Zachodnia", "subregion_key": "zachodnia"},
    {"id": "dabrowski", "name": "powiat dąbrowski", "display_name": "Powiat Dąbrowski", "seat": "Dąbrowa Tarnowska", "is_city": False, "subregion": "Subregion Tarnowski", "subregion_key": "tarnowski"},
    {"id": "gorlicki", "name": "powiat gorlicki", "display_name": "Powiat Gorlicki", "seat": "Gorlice", "is_city": False, "subregion": "Subregion Sądecki", "subregion_key": "sadecki"},
    {"id": "krakowski", "name": "powiat krakowski", "display_name": "Powiat Krakowski", "seat": "Kraków", "is_city": False, "subregion": "Subregion Krakowski (KOM)", "subregion_key": "kom"},
    {"id": "limanowski", "name": "powiat limanowski", "display_name": "Powiat Limanowski", "seat": "Limanowa", "is_city": False, "subregion": "Subregion Sądecki", "subregion_key": "sadecki"},
    {"id": "krakow", "name": "powiat m. Kraków", "display_name": "Kraków (miasto)", "seat": "Kraków", "is_city": True, "subregion": "Subregion Krakowski (KOM)", "subregion_key": "kom"},
    {"id": "nowy-sacz", "name": "powiat m. Nowy Sącz", "display_name": "Nowy Sącz (miasto)", "seat": "Nowy Sącz", "is_city": True, "subregion": "Subregion Sądecki", "subregion_key": "sadecki"},
    {"id": "tarnow", "name": "powiat m. Tarnów", "display_name": "Tarnów (miasto)", "seat": "Tarnów", "is_city": True, "subregion": "Subregion Tarnowski", "subregion_key": "tarnowski"},
    {"id": "miechowski", "name": "powiat miechowski", "display_name": "Powiat Miechowski", "seat": "Miechów", "is_city": False, "subregion": "Subregion Krakowski (KOM)", "subregion_key": "kom"},
    {"id": "myslenicki", "name": "powiat myślenicki", "display_name": "Powiat Myślenicki", "seat": "Myślenice", "is_city": False, "subregion": "Subregion Krakowski (KOM)", "subregion_key": "kom"},
    {"id": "nowosadecki", "name": "powiat nowosądecki", "display_name": "Powiat Nowosądecki", "seat": "Nowy Sącz", "is_city": False, "subregion": "Subregion Sądecki", "subregion_key": "sadecki"},
    {"id": "nowotarski", "name": "powiat nowotarski", "display_name": "Powiat Nowotarski", "seat": "Nowy Targ", "is_city": False, "subregion": "Subregion Podhalański", "subregion_key": "podhalanski"},
    {"id": "olkuski", "name": "powiat olkuski", "display_name": "Powiat Olkuski", "seat": "Olkusz", "is_city": False, "subregion": "Małopolska Zachodnia", "subregion_key": "zachodnia"},
    {"id": "oswiecimski", "name": "powiat oświęcimski", "display_name": "Powiat Oświęcimski", "seat": "Oświęcim", "is_city": False, "subregion": "Małopolska Zachodnia", "subregion_key": "zachodnia"},
    {"id": "proszowicki", "name": "powiat proszowicki", "display_name": "Powiat Proszowicki", "seat": "Proszowice", "is_city": False, "subregion": "Subregion Krakowski (KOM)", "subregion_key": "kom"},
    {"id": "suski", "name": "powiat suski", "display_name": "Powiat Suski", "seat": "Sucha Beskidzka", "is_city": False, "subregion": "Subregion Podhalański", "subregion_key": "podhalanski"},
    {"id": "tarnowski", "name": "powiat tarnowski", "display_name": "Powiat Tarnowski", "seat": "Tarnów", "is_city": False, "subregion": "Subregion Tarnowski", "subregion_key": "tarnowski"},
    {"id": "tatrzanski", "name": "powiat tatrzański", "display_name": "Powiat Tatrzański", "seat": "Zakopane", "is_city": False, "subregion": "Subregion Podhalański", "subregion_key": "podhalanski"},
    {"id": "wadowicki", "name": "powiat wadowicki", "display_name": "Powiat Wadowicki", "seat": "Wadowice", "is_city": False, "subregion": "Małopolska Zachodnia", "subregion_key": "zachodnia"},
    {"id": "wielicki", "name": "powiat wielicki", "display_name": "Powiat Wielicki", "seat": "Wieliczka", "is_city": False, "subregion": "Subregion Krakowski (KOM)", "subregion_key": "kom"},
]

# Mapowanie nazwy powiatu na jego id
RAW_NAME_TO_POWIAT_ID = {p["name"]: p["id"] for p in POWIATY_DATA}

# Przypisanie wskaźników do kategorii
INDICATOR_TO_CATEGORY = {
    "working_age_population": "demografia",
    "urbanization_rate": "demografia",
    "unemployed_longer_than_1_year": "rynek_pracy",
    "cash_social_assistance_benefits": "pomoc_spoleczna",
    "residents_per_social_worker": "pomoc_spoleczna",
    "disability_support_share": "niepelnosprawnosc",
    "severe_disability_share": "niepelnosprawnosc",
    "total_disability_share": "niepelnosprawnosc",
    "average_hospital_stay": "zdrowie",
    "pharmacy_availability": "zdrowie",
    "cancer_incidence": "zdrowie",
    "foster_families_count": "rodzina",
    "care_and_education_centers": "rodzina",
    "kindergarten_availability": "rodzina",
    "large_families_share": "rodzina",
    "municipal_budget_expenditures": "finanse",
    "museum_availability": "kultura",
}


def seed_indicators():
    json_path = Path(__file__).parent / "visualize_data.json"
    if not json_path.exists():
        logger.error(f"Nie znaleziono pliku: {json_path}")
        sys.exit(1)

    logger.info("=== KROK 1: Zasilanie kategorii (indicator_categories) ===")
    r_cat = requests.post(f"{REST_URL}/indicator_categories", headers=HEADERS, json=CATEGORIES_DATA)
    if r_cat.status_code in (200, 201):
        logger.info(f"  ✓ Zapisano {len(CATEGORIES_DATA)} kategorii wskaźników.")
    else:
        logger.warning(f"  Ostrzeżenie przy zapisie kategorii: {r_cat.status_code} - {r_cat.text}")

    logger.info("=== KROK 2: Zasilanie powiatów Małopolski (powiaty) ===")
    r_pow = requests.post(f"{REST_URL}/powiaty", headers=HEADERS, json=POWIATY_DATA)
    if r_pow.status_code in (200, 201):
        logger.info(f"  ✓ Zapisano {len(POWIATY_DATA)} powiatów Małopolski.")
    else:
        logger.warning(f"  Ostrzeżenie przy zapisie powiatów: {r_pow.status_code} - {r_pow.text}")

    logger.info("=== KROK 3: Wczytywanie wskaźników z pliku visualize_data.json ===")
    with open(json_path, "r", encoding="utf-8") as f:
        data = json.load(f)

    logger.info(f"Znaleziono {len(data)} wskaźników do zaimportowania: {list(data.keys())}")

    total_measurements_inserted = 0

    for ind_id, ind_info in data.items():
        name = ind_info.get("name", ind_id)
        unit = ind_info.get("unit", "")
        description = ind_info.get("description", "")
        cat_id = INDICATOR_TO_CATEGORY.get(ind_id)

        logger.info(f"--- Przetwarzanie wskaźnika: '{ind_id}' (Kategoria: {cat_id}) ---")

        # 1. Zapis / Upsert wskaźnika do tabeli 'indicators'
        ind_payload = {
            "id": ind_id,
            "category_id": cat_id,
            "name": name,
            "unit": unit,
            "description": description,
            "source": "ROPS Kraków / GUS"
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
            p_id = RAW_NAME_TO_POWIAT_ID.get(powiat)
            for yr, val in yearly_data.items():
                try:
                    num_val = float(val)
                except (ValueError, TypeError):
                    num_val = 0.0

                measurements.append({
                    "indicator_id": ind_id,
                    "powiat_id": p_id,
                    "powiat_name": powiat,
                    "year": int(yr),
                    "val": num_val,
                    "unit": unit
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
    def get_count(table_name: str) -> str:
        try:
            r = requests.get(
                f"{REST_URL}/{table_name}?select=count",
                headers={
                    "apikey": SUPABASE_KEY,
                    "Authorization": f"Bearer {SUPABASE_KEY}",
                    "Range-Unit": "items",
                    "Prefer": "count=exact"
                }
            )
            return r.headers.get("content-range", "").split("/")[-1] or "N/A"
        except Exception:
            return "N/A"

    cat_count = get_count("indicator_categories")
    pow_count = get_count("powiaty")
    ind_count = get_count("indicators")
    meas_count = get_count("indicator_measurements")

    logger.info("=" * 60)
    logger.info("PODSUMOWANIE IMPORTU DO SUPABASE:")
    logger.info(f"Liczba kategorii w 'indicator_categories': {cat_count}")
    logger.info(f"Liczba powiatów w 'powiaty':               {pow_count}")
    logger.info(f"Liczba wskaźników w 'indicators':          {ind_count}")
    logger.info(f"Liczba pomiarów w 'indicator_measurements': {meas_count}")
    logger.info("=" * 60)
    logger.info("Import zakończony pełnym sukcesem!")


if __name__ == "__main__":
    seed_indicators()
