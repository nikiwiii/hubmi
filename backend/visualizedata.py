import sys
import json
import logging
import argparse
import xml.etree.ElementTree as ET
from pathlib import Path
from typing import Dict, List, Any, Optional
import requests

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
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
    "X-Requested-With": "XMLHttpRequest",
}

INDICATORS_CONFIG = [
    {
        "key": "working_age_population",
        "pointer_id": 56,
        "name": "Working-age population",
        "unit": "%",
        "description": "Share of working-age population in the total population (women 18-59, men 18-64).",
    },
    {
        "key": "unemployed_longer_than_1_year",
        "pointer_id": 189,
        "name": "Unemployed for more than 1 year",
        "unit": "%",
        "description": "Share of unemployed persons registered for more than 1 year in the total number of unemployed.",
    },
    {
        "key": "cash_social_assistance_benefits",
        "pointer_id": 225,
        "name": "Cash social assistance benefits",
        "unit": "%",
        "description": "Share of cash benefits in the total number of social assistance benefits granted.",
    },
    {
        "key": "foster_families_count",
        "pointer_id": 29,
        "name": "Number of foster families",
        "unit": "count",
        "description": "Number of active foster families (related, non-professional, professional).",
    },
    {
        "key": "average_hospital_stay",
        "pointer_id": 85,
        "name": "Average hospital stay duration",
        "unit": "days",
        "description": "Average length of patient stay in a hospital ward (in days).",
    },
]


def clean_numeric_value(raw_val: Optional[str]) -> Optional[float]:
    """Parse raw XML string into clean float/int or None."""
    if not raw_val:
        return None
    val_str = raw_val.strip()
    val_str = val_str.replace("%25", "").replace("%", "").replace(",", ".").strip()
    if not val_str:
        return None
    try:
        val_float = float(val_str)
        return int(val_float) if val_float.is_integer() else round(val_float, 2)
    except ValueError:
        return None


def fetch_indicator_year_data(indicator_id: int, year: str) -> Dict[str, Optional[float]]:
    """Fetch indicator data for a specific year from flashdata XML endpoint."""
    url = f"{BASE_URL}/portrait/flashdata/year/{year}/pointer/{indicator_id}"
    try:
        r = requests.get(url, headers=HEADERS, timeout=15)
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


def scrape_indicator(ind_cfg: dict, target_years: List[str]) -> Dict[str, Any]:
    """Scrape 10-year time series for a single indicator across all regions."""
    ind_id = ind_cfg["pointer_id"]
    name = ind_cfg["name"]
    logger.info(f"Fetching data: {name}...")

    data_by_year: Dict[str, Dict[str, Optional[float]]] = {}
    valid_years: List[str] = []
    all_regions_set = set()

    for year in target_years:
        year_data = fetch_indicator_year_data(ind_id, year)
        if year_data:
            data_by_year[year] = year_data
            valid_years.append(year)
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
            "series": chart_series
        }
    }


def main():
    parser = argparse.ArgumentParser(description="Scrape 10-year historical data for 5 indicators from ROPS Obserwator.")
    parser.add_argument("--start-year", type=int, default=2014, help="Start year (default: 2014)")
    parser.add_argument("--end-year", type=int, default=2024, help="End year (default: 2024)")
    parser.add_argument("-o", "--output", type=str, default="visualize_data.json", help="Output JSON filename")
    args = parser.parse_args()

    target_years = [str(y) for y in range(args.start_year, args.end_year + 1)]
    results: Dict[str, Any] = {}
    for ind_cfg in INDICATORS_CONFIG:
        section_key = ind_cfg["key"]
        results[section_key] = scrape_indicator(ind_cfg, target_years)

    base_dir = Path(__file__).resolve().parent
    out_path = Path(args.output)
    if not out_path.is_absolute():
        out_path = base_dir / args.output

    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(results, f, ensure_ascii=False, indent=2)
    logger.info(f"Saved data to: {out_path}")

if __name__ == "__main__":
    main()
