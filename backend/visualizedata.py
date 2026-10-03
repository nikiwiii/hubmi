import sys
import json
import logging
import argparse
import xml.etree.ElementTree as ET
from pathlib import Path
from typing import Dict, List, Any, Optional
from concurrent.futures import ThreadPoolExecutor, as_completed
import requests
from requests.adapters import HTTPAdapter
from urllib3.util import Retry

if sys.platform.startswith("win"):
    try:
        sys.stdout.reconfigure(encoding="utf-8")
        sys.stderr.reconfigure(encoding="utf-8")
    except AttributeError:
        pass

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("visualizedata")

BASE_URL = "https://obserwator.rops.krakow.pl"
HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "X-Requested-With": "XMLHttpRequest",
}

INDICATORS_CONFIG = [
    {
        "key": "working_age_population",
        "pointer_id": 56,
        "name": "Ludność w wieku produkcyjnym",
        "unit": "%",
        "description": "Udział ludności w wieku produkcyjnym w ogólnej liczbie ludności (kobiety 18–59 lat, mężczyźni 18–64 lata).",
    },
    {
        "key": "unemployed_longer_than_1_year",
        "pointer_id": 189,
        "name": "Bezrobotni powyżej 1 roku",
        "unit": "%",
        "description": "Udział osób bezrobotnych zarejestrowanych powyżej 1 roku w ogólnej liczbie bezrobotnych.",
    },
    {
        "key": "cash_social_assistance_benefits",
        "pointer_id": 225,
        "name": "Pieniężne świadczenia z pomocy społecznej",
        "unit": "%",
        "description": "Udział świadczeń pieniężnych w ogólnej liczbie przyznanych świadczeń z pomocy społecznej.",
    },
    {
        "key": "foster_families_count",
        "pointer_id": 29,
        "name": "Liczba rodzin zastępczych",
        "unit": "rodzin",
        "description": "Liczba aktywnych rodzin zastępczych (spokrewnionych, niezawodowych oraz zawodowych).",
    },
    {
        "key": "average_hospital_stay",
        "pointer_id": 85,
        "name": "Średni czas pobytu w szpitalu",
        "unit": "dni",
        "description": "Przeciętna długość pobytu pacjenta na oddziale szpitalnym (w dniach).",
    },
    {
        "key": "urbanization_rate",
        "pointer_id": 4,
        "name": "Wskaźnik urbanizacji",
        "unit": "%",
        "description": "Udział ludności miejskiej w ogólnej liczbie mieszkańców danego powiatu.",
    },
    {
        "key": "kindergarten_availability",
        "pointer_id": 23,
        "name": "Dostępność miejsc w przedszkolach",
        "unit": "dzieci/miejsce",
        "description": "Liczba dzieci w wieku 3–5 lat przypadających na jedno miejsce w przedszkolu.",
    },
    {
        "key": "pharmacy_availability",
        "pointer_id": 2,
        "name": "Dostępność aptek",
        "unit": "mieszkańców/aptekę",
        "description": "Liczba mieszkańców przypadających na jedną aptekę ogólnodostępną.",
    },
    {
        "key": "cancer_incidence",
        "pointer_id": 88,
        "name": "Zapadalność na nowotwory",
        "unit": "na 1 000 osób",
        "description": "Liczba pacjentów w wieku 19+ ze zdiagnozowanym nowotworem pod opieką POZ na 1 000 mieszkańców w wieku 19+.",
    },
    {
        "key": "care_and_education_centers",
        "pointer_id": 248,
        "name": "Placówki opiekuńczo-wychowawcze",
        "unit": "placówek",
        "description": "Liczba aktywnych instytucjonalnych placówek opiekuńczo-wychowawczych dla dzieci i młodzieży.",
    },
    {
        "key": "residents_per_social_worker",
        "pointer_id": 27,
        "name": "Mieszkańcy na pracownika socjalnego",
        "unit": "mieszkańców/pracownika",
        "description": "Liczba mieszkańców przypadających na jednego pracownika socjalnego zatrudnionego w ośrodku pomocy społecznej.",
    },
    {
        "key": "large_families_share",
        "pointer_id": 237,
        "name": "Udział rodzin wielodzietnych",
        "unit": "%",
        "description": "Udział rodzin z 3 lub większą liczbą dzieci na utrzymaniu do 24 roku życia we wszystkich rodzinach z dziećmi (NSP).",
        "fallback_years": ["2011"],
    },
    {
        "key": "municipal_budget_expenditures",
        "pointer_id": 94,
        "name": "Wydatki budżetów gmin na mieszkańca",
        "unit": "zł/mieszkańca",
        "description": "Łączne wydatki budżetów gmin i miast na prawach powiatu w przeliczeniu na 1 mieszkańca (w zł).",
    },
    {
        "key": "museum_availability",
        "pointer_id": 21,
        "name": "Dostępność muzeów",
        "unit": "mieszkańców/muzeum",
        "description": "Liczba mieszkańców przypadających na jedno muzeum lub oddział muzealny.",
    },
]


def create_resilient_session(pool_connections: int = 10, pool_maxsize: int = 20) -> requests.Session:
    """Create a requests session with connection pooling and retries."""
    session = requests.Session()
    retry_strategy = Retry(
        total=3,
        backoff_factor=0.5,
        status_forcelist=[429, 500, 502, 503, 504],
        allowed_methods=["GET"],
    )
    adapter = HTTPAdapter(
        max_retries=retry_strategy,
        pool_connections=pool_connections,
        pool_maxsize=pool_maxsize,
    )
    session.mount("https://", adapter)
    session.mount("http://", adapter)
    session.headers.update(HEADERS)
    return session


def clean_numeric_value(raw_val: Optional[str]) -> Optional[float]:
    """Parse raw XML string into clean float/int or None."""
    if not raw_val:
        return None
    val_str = raw_val.strip()
    val_str = val_str.replace("%25", "").replace("%", "").replace("\xa0", "").strip()
    val_str = val_str.replace(",", ".")
    if not val_str or any(kw in val_str.lower() for kw in ["brak", "b/d", "nd", "-"]):
        return None
    try:
        val_float = float(val_str)
        return int(val_float) if val_float.is_integer() else round(val_float, 2)
    except ValueError:
        return None


def fetch_indicator_year_data(
    indicator_id: int, year: str, session: Optional[requests.Session] = None
) -> Dict[str, Optional[float]]:
    """Fetch indicator data for a specific year from flashdata XML endpoint."""
    url = f"{BASE_URL}/portrait/flashdata/year/{year}/pointer/{indicator_id}"
    req_lib = session if session is not None else requests
    try:
        r = req_lib.get(url, headers=HEADERS, timeout=15)
        if r.status_code != 200 or not r.text.strip():
            return {}
        if "<regions>" not in r.text:
            return {}

        root = ET.fromstring(r.text)
        regions_data: Dict[str, Optional[float]] = {}
        for region_el in root.findall(".//region"):
            reg_name = region_el.attrib.get("name", "").strip()
            if reg_name:
                raw_val = region_el.text
                clean_val = clean_numeric_value(raw_val)
                regions_data[reg_name] = clean_val
        return regions_data
    except Exception as e:
        logger.error(f"Error fetching indicator {indicator_id} for year {year}: {e}")
        return {}


def scrape_indicator(
    ind_cfg: dict,
    target_years: List[str],
    session: Optional[requests.Session] = None,
    max_workers: int = 6,
) -> Dict[str, Any]:
    """Scrape time series for a single indicator across all regions using concurrent requests."""
    ind_id = ind_cfg["pointer_id"]
    name = ind_cfg["name"]
    logger.info(f"Fetching data: {name} (ID: {ind_id})...")

    data_by_year: Dict[str, Dict[str, Optional[float]]] = {}
    valid_years: List[str] = []
    all_regions_set = set()

    years_to_query = list(target_years)

    def fetch_single(y: str):
        return y, fetch_indicator_year_data(ind_id, y, session=session)

    with ThreadPoolExecutor(max_workers=max_workers) as executor:
        future_to_year = {executor.submit(fetch_single, y): y for y in years_to_query}
        for future in as_completed(future_to_year):
            year, year_data = future.result()
            if year_data:
                data_by_year[year] = year_data
                valid_years.append(year)
                all_regions_set.update(year_data.keys())

    # Fallback for indicators with unique historical data (e.g. Census 2011 for ID 237)
    if not valid_years and ind_cfg.get("fallback_years"):
        fallback_years = ind_cfg["fallback_years"]
        for y in fallback_years:
            year_data = fetch_indicator_year_data(ind_id, y, session=session)
            if year_data:
                data_by_year[y] = year_data
                valid_years.append(y)
                all_regions_set.update(year_data.keys())

    sorted_years = sorted(valid_years, key=lambda y: int(y))
    sorted_regions = sorted(list(all_regions_set))

    series_by_region: Dict[str, Dict[str, Optional[float]]] = {}
    for region in sorted_regions:
        series_by_region[region] = {}
        for year in sorted_years:
            val = data_by_year.get(year, {}).get(region)
            series_by_region[region][year] = val

    chart_series: Dict[str, List[Optional[float]]] = {}
    for region in sorted_regions:
        chart_series[region] = [series_by_region[region].get(y) for y in sorted_years]

    return {
        "name": name,
        "unit": ind_cfg.get("unit"),
        "description": ind_cfg.get("description"),
        "years": sorted_years,
        "dane_powiaty": series_by_region,
        "chart_data": {
            "years": sorted_years,
            "series": chart_series,
        },
    }


def main():
    parser = argparse.ArgumentParser(
        description="Scrape 10-year historical data for indicators from ROPS Obserwator."
    )
    parser.add_argument("--start-year", type=int, default=2014, help="Start year (default: 2014)")
    parser.add_argument("--end-year", type=int, default=2024, help="End year (default: 2024)")
    parser.add_argument("-o", "--output", type=str, default="visualize_data.json", help="Output JSON filename")
    parser.add_argument("--workers", type=int, default=8, help="Number of concurrent network workers (default: 8)")
    args = parser.parse_args()

    target_years = [str(y) for y in range(args.start_year, args.end_year + 1)]
    results: Dict[str, Any] = {}

    session = create_resilient_session(pool_connections=args.workers, pool_maxsize=args.workers * 2)

    try:
        for ind_cfg in INDICATORS_CONFIG:
            section_key = ind_cfg["key"]
            results[section_key] = scrape_indicator(
                ind_cfg, target_years, session=session, max_workers=args.workers
            )
    finally:
        session.close()

    base_dir = Path(__file__).resolve().parent
    out_path = Path(args.output)
    if not out_path.is_absolute():
        out_path = base_dir / args.output

    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(results, f, ensure_ascii=False, indent=2)
    logger.info(f"Saved data to: {out_path}")


if __name__ == "__main__":
    main()
