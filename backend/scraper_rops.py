#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
ROPS Obserwator Web Scraper & Database Syncer
Strona źródłowa: https://obserwator.rops.krakow.pl

Skrypt pobiera wskaźniki społeczne, kategorie tematyczne oraz szeregi czasowe
dla 22 powiatów Małopolski i zapisuje je w strukturze zgodnej z bazą danych:
  1. indicator_categories (id, name, description, icon, color, sort_order)
  2. indicators (id, category_id, name, unit, description, source)
  3. indicator_measurements (id, indicator_id, powiat_name, powiat_id, year, val, unit)

Oraz aktualizuje lokalny zbiór visualize_data.json.
"""

import os
import sys
import io
import re
import json
import time
import logging
import argparse
import unicodedata
import xml.etree.ElementTree as ET
from pathlib import Path
from typing import Dict, List, Any, Optional, Tuple, Set, cast
from concurrent.futures import ThreadPoolExecutor, as_completed
import urllib3
import requests
from requests.adapters import HTTPAdapter
from urllib3.util import Retry
from dotenv import load_dotenv

# Wymuszenie kodowania UTF-8 dla konsoli Windows
if sys.platform.startswith("win"):
    if hasattr(sys.stdout, "reconfigure"):
        getattr(sys.stdout, "reconfigure")(encoding="utf-8")
    if hasattr(sys.stderr, "reconfigure"):
        getattr(sys.stderr, "reconfigure")(encoding="utf-8")

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    datefmt="%H:%M:%S"
)
logger = logging.getLogger("scraper_rops")

# Wyłączenie ostrzeżeń SSL dla urllib3
urllib3.disable_warnings()

BASE_URL = "https://obserwator.rops.krakow.pl"
HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/124.0.0.0 Safari/537.36"
    ),
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Accept-Language": "pl-PL,pl;q=0.9,en-US;q=0.8,en;q=0.7",
}

# ==============================================================================
# SŁOWNIK MAPOWANIA NAZW POWIATÓW Z ROPS OBSERWATOR DO POWIAT_ID
# ==============================================================================
RAW_NAME_TO_POWIAT_ID: Dict[str, str] = {
    "powiat bocheński": "bochenski",
    "powiat brzeski": "brzeski",
    "powiat chrzanowski": "chrzanowski",
    "powiat dąbrowski": "dabrowski",
    "powiat gorlicki": "gorlicki",
    "powiat krakowski": "krakowski",
    "powiat limanowski": "limanowski",
    "powiat m. Kraków": "krakow",
    "powiat m. Nowy Sącz": "nowy-sacz",
    "powiat m. Tarnów": "tarnow",
    "powiat miechowski": "miechowski",
    "powiat myślenicki": "myslenicki",
    "powiat nowosądecki": "nowosadecki",
    "powiat nowotarski": "nowotarski",
    "powiat olkuski": "olkuski",
    "powiat oświęcimski": "oswiecimski",
    "powiat proszowicki": "proszowicki",
    "powiat suski": "suski",
    "powiat tarnowski": "tarnowski",
    "powiat tatrzański": "tatrzanski",
    "powiat wadowicki": "wadowicki",
    "powiat wielicki": "wielicki",
}

# ==============================================================================
# OFICJALNE KATEGORIE TEMATYCZNE ROPS OBSERWATOR Z PALETĄ KOLORÓW
# ==============================================================================
CATEGORY_METADATA: Dict[str, Dict[str, Any]] = {
    "ludnosc": {
        "name": "Ludność",
        "description": "Demografia, struktura wieku, urbanizacja, dynamika populacji i przyrost naturalny.",
        "color": "#698B99",
        "icon": "users",
        "sort_order": 1,
    },
    "gospodarstwa_domowe": {
        "name": "Gospodarstwa domowe",
        "description": "Zagrożenie ubóstwem, wielkość gospodarstw i dochody transferowe.",
        "color": "#B8A663",
        "icon": "home",
        "sort_order": 2,
    },
    "rodzina": {
        "name": "Rodzina",
        "description": "Liczba rodzin, rodziny z dziećmi na utrzymaniu, rodziny wielodzietne.",
        "color": "#8E77A3",
        "icon": "heart",
        "sort_order": 3,
    },
    "pomoc_spoleczna_kadra": {
        "name": "Pomoc społeczna - Kadra",
        "description": "Pracownicy socjalni, wykształcenie i stopnie specjalizacji kadry OPS.",
        "color": "#D97706",
        "icon": "user-check",
        "sort_order": 4,
    },
    "pomoc_spoleczna_powody_korzystania": {
        "name": "Pomoc społeczna - Powody korzystania",
        "description": "Ubóstwo, bezrobocie, bezdomność, długotrwała choroba, uzależnienia.",
        "color": "#E11D48",
        "icon": "alert-circle",
        "sort_order": 5,
    },
    "pomoc_spoleczna_beneficjenci": {
        "name": "Pomoc społeczna - Beneficjenci",
        "description": "Beneficjenci pomocy, rodziny niepełne, wielodzietne, stypendia socjalne.",
        "color": "#F59E0B",
        "icon": "users",
        "sort_order": 6,
    },
    "pomoc_spoleczna_swiadczenia": {
        "name": "Pomoc społeczna - Świadczenia",
        "description": "Świadczenia pieniężne, niepieniężne, usługi opiekuńcze, kontrakty socjalne.",
        "color": "#B8A663",
        "icon": "banknote",
        "sort_order": 7,
    },
    "pomoc_spoleczna_i_otoczenie_infrastruktura": {
        "name": "Pomoc społeczna - Infrastruktura",
        "description": "Domy pomocy społecznej, CIS, KIS, mieszkania treningowe, placówki wsparcia.",
        "color": "#0D9488",
        "icon": "building",
        "sort_order": 8,
    },
    "piecza_zastepcza": {
        "name": "Piecza zastępcza",
        "description": "Rodziny zastępcze, dzieci w pieczy, deinstytucjonalizacja, usamodzielnienia.",
        "color": "#8E77A3",
        "icon": "heart-handshake",
        "sort_order": 9,
    },
    "zdrowie": {
        "name": "Zdrowie",
        "description": "Dostępność aptek, szpitali, hospitalizacja, zachorowalność na nowotwory i cukrzycę.",
        "color": "#7C89B8",
        "icon": "activity",
        "sort_order": 10,
    },
    "niepelnosprawnosc": {
        "name": "Niepełnosprawność",
        "description": "Osoby niepełnosprawne prawnie i biologicznie, stopnie niepełnosprawności, zatrudnienie.",
        "color": "#9333EA",
        "icon": "accessibility",
        "sort_order": 11,
    },
    "wynagrodzenia_emerytury_i_renty": {
        "name": "Wynagrodzenia, emerytury i renty",
        "description": "Przeciętne wynagrodzenia w relacji do średniej krajowej, emerytury i renty.",
        "color": "#10B981",
        "icon": "credit-card",
        "sort_order": 12,
    },
    "kultura": {
        "name": "Kultura",
        "description": "Dostępność kin, muzeów, domów kultury, bibliotek oraz wskaźniki czytelnictwa.",
        "color": "#6366F1",
        "icon": "book-open",
        "sort_order": 13,
    },
    "edukacja": {
        "name": "Edukacja",
        "description": "Dostępność przedszkoli, edukacja przedszkolna, zdawalność matur i egzaminów ósmoklasisty.",
        "color": "#2563EB",
        "icon": "graduation-cap",
        "sort_order": 14,
    },
    "rynek_pracy": {
        "name": "Rynek pracy",
        "description": "Stopa bezrobocia, bezrobocie długotrwałe, wskaźniki zatrudnienia kobiet i młodych.",
        "color": "#A6737E",
        "icon": "briefcase",
        "sort_order": 15,
    },
    "mobilnosc": {
        "name": "Mobilność",
        "description": "Saldo migracji stałych, zagranicznych, europejskich i międzywojewódzkich.",
        "color": "#0284C7",
        "icon": "navigation",
        "sort_order": 16,
    },
    "budzety_gmin": {
        "name": "Budżety gmin",
        "description": "Wydatki budżetów gmin ogółem na mieszkańca, oświata, kultura, pomoc społeczna.",
        "color": "#059669",
        "icon": "wallet",
        "sort_order": 17,
    },
}

# ==============================================================================
# MAPOWANIE KLUCZY DLA GŁÓWNYCH 14 WSKAŹNIKÓW (KOMPATYBILNOŚĆ Z FRONTENDEM)
# ==============================================================================
CORE_INDICATORS_MAPPING: Dict[int, Dict[str, Any]] = {
    56: {
        "key": "working_age_population",
        "category_id": "ludnosc",
        "name": "Ludność w wieku produkcyjnym",
        "unit": "%",
        "description": "Udział ludności w wieku produkcyjnym w ogólnej liczbie ludności (kobiety 18–59 lat, mężczyźni 18–64 lata).",
    },
    189: {
        "key": "unemployed_longer_than_1_year",
        "category_id": "rynek_pracy",
        "name": "Bezrobotni powyżej 1 roku",
        "unit": "%",
        "description": "Udział osób bezrobotnych zarejestrowanych powyżej 1 roku w ogólnej liczbie bezrobotnych.",
    },
    225: {
        "key": "cash_social_assistance_benefits",
        "category_id": "pomoc_spoleczna_swiadczenia",
        "name": "Pieniężne świadczenia z pomocy społecznej",
        "unit": "%",
        "description": "Udział świadczeń pieniężnych w ogólnej liczbie przyznanych świadczeń z pomocy społecznej.",
    },
    29: {
        "key": "foster_families_count",
        "category_id": "piecza_zastepcza",
        "name": "Liczba rodzin zastępczych",
        "unit": "rodzin",
        "description": "Liczba aktywnych rodzin zastępczych (spokrewnionych, niezawodowych oraz zawodowych).",
    },
    85: {
        "key": "average_hospital_stay",
        "category_id": "zdrowie",
        "name": "Średni czas pobytu w szpitalu",
        "unit": "dni",
        "description": "Przeciętna długość pobytu pacjenta na oddziale szpitalnym (w dniach).",
    },
    4: {
        "key": "urbanization_rate",
        "category_id": "ludnosc",
        "name": "Wskaźnik urbanizacji",
        "unit": "%",
        "description": "Udział ludności miejskiej w ogólnej liczbie mieszkańców danego powiatu.",
    },
    23: {
        "key": "kindergarten_availability",
        "category_id": "edukacja",
        "name": "Dostępność miejsc w przedszkolach",
        "unit": "dzieci/miejsce",
        "description": "Liczba dzieci w wieku 3–5 lat przypadających na jedno miejsce w przedszkolu.",
    },
    2: {
        "key": "pharmacy_availability",
        "category_id": "zdrowie",
        "name": "Dostępność aptek",
        "unit": "mieszkańców/aptekę",
        "description": "Liczba mieszkańców przypadających na jedną aptekę ogólnodostępną.",
    },
    88: {
        "key": "cancer_incidence",
        "category_id": "zdrowie",
        "name": "Zapadalność na nowotwory",
        "unit": "na 1 000 osób",
        "description": "Liczba pacjentów w wieku 19+ ze zdiagnozowanym nowotworem pod opieką POZ na 1 000 mieszkańców w wieku 19+.",
    },
    248: {
        "key": "care_and_education_centers",
        "category_id": "pomoc_spoleczna_i_otoczenie_infrastruktura",
        "name": "Placówki opiekuńczo-wychowawcze",
        "unit": "placówek",
        "description": "Liczba aktywnych instytucjonalnych placówek opiekuńczo-wychowawczych dla dzieci i młodzieży.",
    },
    27: {
        "key": "residents_per_social_worker",
        "category_id": "pomoc_spoleczna_kadra",
        "name": "Mieszkańcy na pracownika socjalnego",
        "unit": "mieszkańców/pracownika",
        "description": "Liczba mieszkańców przypadających na jednego pracownika socjalnego zatrudnionego w ośrodku pomocy społecznej.",
    },
    237: {
        "key": "large_families_share",
        "category_id": "rodzina",
        "name": "Udział rodzin wielodzietnych",
        "unit": "%",
        "description": "Udział rodzin z 3 lub większą liczbą dzieci na utrzymaniu do 24 roku życia we wszystkich rodzinach z dziećmi (NSP).",
    },
    94: {
        "key": "municipal_budget_expenditures",
        "category_id": "budzety_gmin",
        "name": "Wydatki budżetów gmin na mieszkańca",
        "unit": "zł/mieszkańca",
        "description": "Łączne wydatki budżetów gmin i miast na prawach powiatu w przeliczeniu na 1 mieszkańca (w zł).",
    },
    21: {
        "key": "museum_availability",
        "category_id": "kultura",
        "name": "Dostępność muzeów",
        "unit": "mieszkańców/muzeum",
        "description": "Liczba mieszkańców przypadających na jedno muzeum lub oddział muzealny.",
    },
    215: {
        "key": "total_disability_share",
        "category_id": "niepelnosprawnosc",
        "name": "Odsetek osób z niepełnosprawnościami ogółem",
        "unit": "%",
        "description": "Odsetek mieszkańców posiadających orzeczenie o niepełnosprawności w ogólnej populacji powiatu (NSP).",
    },
    219: {
        "key": "severe_disability_share",
        "category_id": "niepelnosprawnosc",
        "name": "Osoby ze znacznym stopniem niepełnosprawności",
        "unit": "%",
        "description": "Odsetek osób ze znacznym stopniem niepełnosprawności w populacji osób z orzeczeniem (NSP).",
    },
    33: {
        "key": "disability_support_share",
        "category_id": "niepelnosprawnosc",
        "name": "Pomoc społeczna z powodu niepełnosprawności",
        "unit": "%",
        "description": "Udział rodzin i osób z niepełnosprawnościami objętych świadczeniami pomocy społecznej w ogólnej liczbie podopiecznych.",
    },
}


def slugify(text: str) -> str:
    """Tworzy bezpieczny identyfikator SQL/URL z polskiego tekstu (do max 64 znaków)."""
    text = text.lower().strip()
    text = text.replace("ł", "l").replace("Ł", "l")
    text = unicodedata.normalize("NFKD", text).encode("ascii", "ignore").decode("utf-8")
    text = re.sub(r"[^a-z0-9]+", "_", text)
    return text.strip("_")[:64]


def create_resilient_session(pool_size: int = 10) -> requests.Session:
    """Tworzy sesję HTTP z pulą połączeń i automatycznymi ponowieniami."""
    session = requests.Session()
    retry_strategy = Retry(
        total=3,
        backoff_factor=0.4,
        status_forcelist=[429, 500, 502, 503, 504],
        allowed_methods=["GET", "POST"],
    )
    adapter = HTTPAdapter(
        max_retries=cast(Any, retry_strategy),
        pool_connections=pool_size,
        pool_maxsize=pool_size * 2,
    )
    session.mount("https://", adapter)
    session.mount("http://", adapter)
    session.headers.update(HEADERS)
    return session


def clean_numeric_value(raw_val: Optional[str]) -> Optional[float]:
    """Czyści surową wartość tekstową z XML/HTML do float lub None."""
    if not raw_val:
        return None
    val_str = raw_val.strip()
    val_str = val_str.replace("%25", "").replace("%", "").replace("\xa0", "").strip()
    val_str = val_str.replace(",", ".")
    if not val_str or any(kw in val_str.lower() for kw in ["brak", "b/d", "nd", "-", "null"]):
        return None
    try:
        val_float = float(val_str)
        return int(val_float) if val_float.is_integer() else round(val_float, 2)
    except ValueError:
        return None


def infer_unit(name: str, desc: str, raw_sample: Optional[str]) -> str:
    """Rozpoznaje jednostkę miary na podstawie wartości, opisu lub nazwy wskaźnika."""
    if raw_sample and ("%25" in raw_sample or "%" in raw_sample):
        return "%"
    combined = f"{name} {desc}".lower()
    if "%" in combined or "odsetek" in combined or "udział" in combined or "stopa" in combined:
        return "%"
    if "zł/mieszkańca" in combined or "(w zł)" in combined or "złotych" in combined:
        return "zł/mieszkańca"
    if "(w dniach)" in combined or "dni hospitalizacji" in combined:
        return "dni"
    if "rodzin zastępczych" in combined:
        return "rodzin"
    if "na 1 000" in combined or "na 1000" in combined:
        return "na 1 000 osób"
    if "mieszkańców na 1 pracownika" in combined:
        return "mieszkańców/pracownika"
    if "dostępność aptek" in combined or "mieszkańców na 1 aptekę" in combined:
        return "mieszkańców/aptekę"
    if "dostępność muzeów" in combined or "mieszkańców na 1 muzeum" in combined:
        return "mieszkańców/muzeum"
    if "dostępność kin" in combined:
        return "mieszkańców/kino"
    if "dostępność bibliotek" in combined:
        return "mieszkańców/bibliotekę"
    if "miejsc w przedszkolach" in combined or "przedszkol" in combined:
        return "dzieci/miejsce"
    if "placówek" in combined:
        return "placówek"
    if "liczba osób" in combined or "osób" in combined:
        return "osób"
    return "liczba"


class RopsObserwatorScraper:
    def __init__(self, session: Optional[requests.Session] = None, workers: int = 8):
        self.session = session or create_resilient_session(pool_size=workers)
        self.workers = workers

    def discover_categories_and_indicators(self) -> List[Dict[str, Any]]:
        """
        Pobiera strukturę menu bocznego ze strony głównej ROPS Obserwator.
        Zwraca listę kategorii wraz ze zdefiniowanymi w nich wskaźnikami.
        """
        logger.info(f"Pobieranie struktury menu i wskaźników z {BASE_URL}...")
        try:
            r = self.session.get(BASE_URL, verify=False, timeout=15)
            r.raise_for_status()
        except Exception as e:
            logger.error(f"Nie udało się połączyć ze stroną główną ROPS: {e}")
            return []

        from bs4 import BeautifulSoup
        soup = BeautifulSoup(r.text, "html.parser")
        items = soup.find_all(class_="side-menu__nav-item")

        discovered_categories: List[Dict[str, Any]] = []

        for item in items:
            btn = item.find("button", class_="side-menu__nav-link")
            if not btn:
                continue
            cat_raw_name = btn.get_text(strip=True)
            cat_slug = slugify(cat_raw_name)

            if cat_slug in ["portret_gminy_i_powiatu", ""]:
                continue

            subnav = item.find(class_="side-menu__subnav")
            pointers: List[Dict[str, Any]] = []

            if subnav:
                for a in subnav.find_all("a", href=True):
                    href = str(a.get("href") or "")
                    text = a.get_text(strip=True)
                    if "/differenceanalysis/" in href:
                        pid_str = href.split("/differenceanalysis/")[-1].strip("/")
                        if pid_str.isdigit():
                            pointers.append({
                                "pointer_id": int(pid_str),
                                "name": text,
                                "url": f"{BASE_URL}{href}",
                            })

            meta = CATEGORY_METADATA.get(cat_slug, {
                "name": cat_raw_name.capitalize(),
                "description": f"Wskaźniki z obszaru: {cat_raw_name.lower()}.",
                "color": "#698B99",
                "icon": "activity",
                "sort_order": len(discovered_categories) + 1,
            })

            discovered_categories.append({
                "id": cat_slug,
                "name": meta["name"],
                "description": meta.get("description", ""),
                "color": meta.get("color", "#698B99"),
                "icon": meta.get("icon", "activity"),
                "sort_order": meta.get("sort_order", len(discovered_categories) + 1),
                "pointers": pointers,
            })

        total_indicators = sum(len(c["pointers"]) for c in discovered_categories)
        logger.info(
            f"Odkryto {len(discovered_categories)} kategorii oraz {total_indicators} wskaźników na stronie ROPS."
        )
        return discovered_categories

    def fetch_indicator_metadata(self, pointer_id: int) -> Dict[str, Any]:
        """Pobiera metadane (opis, źródło, dostępne lata) z podstrony danego wskaźnika."""
        url = f"{BASE_URL}/differenceanalysis/{pointer_id}"
        try:
            r = self.session.get(url, verify=False, timeout=12)
            if r.status_code != 200:
                return {}
        except Exception as e:
            logger.warning(f"Błąd pobierania metadanych dla pointer_id {pointer_id}: {e}")
            return {}

        from bs4 import BeautifulSoup
        soup = BeautifulSoup(r.text, "html.parser")

        # 1. Opis i źródło
        desc = ""
        source = ""
        name = ""
        ac = soup.find(class_="analysisContent")
        if ac:
            for tag in ac.find_all(["h2", "h3"]):
                next_p = tag.find_next_sibling("p")
                txt = next_p.get_text(strip=True) if next_p else ""
                tag_t = tag.get_text(strip=True).lower()
                if "nazwa" in tag_t:
                    name = txt
                elif "opis" in tag_t:
                    desc = txt
                elif "źródło" in tag_t:
                    source = txt

        # 2. Dostępne lata w select
        years: List[str] = []
        year_select = soup.find("select", attrs={"name": re.compile(r"\[year\]")})
        if year_select:
            for opt in year_select.find_all("option"):
                val = str(opt.get("value") or "").strip()
                if val.isdigit():
                    years.append(val)

        return {
            "name": name,
            "description": desc,
            "source": source,
            "available_years": sorted(years, key=lambda y: int(y)),
        }

    def fetch_pointer_year_xml(
        self, pointer_id: int, year: str
    ) -> Tuple[str, Dict[str, Optional[float]], Optional[str]]:
        """Pobiera i parsuje dane dla danego wskaźnika i roku z endpointu flashdata XML."""
        url = f"{BASE_URL}/portrait/flashdata/year/{year}/pointer/{pointer_id}"
        try:
            r = self.session.get(url, verify=False, timeout=10)
            if r.status_code != 200 or not r.text.strip() or "<regions>" not in r.text:
                return year, {}, None

            root = ET.fromstring(r.text)
            regions_data: Dict[str, Optional[float]] = {}
            raw_sample: Optional[str] = None

            for reg in root.findall(".//region"):
                r_name = reg.attrib.get("name", "").strip()
                if r_name:
                    raw_val = reg.text
                    if not raw_sample and raw_val:
                        raw_sample = raw_val
                    clean_val = clean_numeric_value(raw_val)
                    regions_data[r_name] = clean_val

            return year, regions_data, raw_sample
        except Exception as e:
            logger.debug(f"Pominięto XML dla wskaźnika {pointer_id} / rok {year}: {e}")
            return year, {}, None

    def scrape_indicator_time_series(
        self,
        pointer_id: int,
        target_years: List[str],
        known_meta: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        """Pobiera pełen szereg czasowy dla wskaźnika w zadanym zakresie lat."""
        page_meta = self.fetch_indicator_metadata(pointer_id)

        name = known_meta.get("name") if known_meta else page_meta.get("name") or f"Wskaźnik {pointer_id}"
        desc = known_meta.get("description") if known_meta else page_meta.get("description", "")
        source = page_meta.get("source", "ROPS Kraków / Główny Urząd Statystyczny")

        # Jeśli dostępne są lata ze strony, użyj ich przecięcia z target_years
        avail_years = page_meta.get("available_years")
        years_to_query = target_years
        if avail_years:
            years_to_query = [y for y in target_years if y in avail_years] or avail_years

        data_by_year: Dict[str, Dict[str, Optional[float]]] = {}
        valid_years: List[str] = []
        raw_samples: List[str] = []

        with ThreadPoolExecutor(max_workers=min(self.workers, len(years_to_query) or 1)) as pool:
            futures = [pool.submit(self.fetch_pointer_year_xml, pointer_id, y) for y in years_to_query]
            for f in as_completed(futures):
                yr, reg_data, sample = f.result()
                if reg_data:
                    data_by_year[yr] = reg_data
                    valid_years.append(yr)
                if sample:
                    raw_samples.append(sample)

        sorted_years = sorted(valid_years, key=lambda y: int(y))
        raw_sample = raw_samples[0] if raw_samples else None

        # Jeśli brak danych w wybranym oknie lat (np. Spis Powszechny 2011), sprawdź pozostałe lata
        if not sorted_years and avail_years:
            other_years = [y for y in avail_years if y not in years_to_query]
            if other_years:
                with ThreadPoolExecutor(max_workers=min(self.workers, len(other_years))) as pool:
                    futures = [pool.submit(self.fetch_pointer_year_xml, pointer_id, y) for y in other_years]
                    for f in as_completed(futures):
                        yr, reg_data, sample = f.result()
                        if reg_data:
                            data_by_year[yr] = reg_data
                            valid_years.append(yr)
                        if sample and not raw_sample:
                            raw_sample = sample
                sorted_years = sorted(valid_years, key=lambda y: int(y))

        unit = (
            known_meta.get("unit")
            if (known_meta and known_meta.get("unit"))
            else infer_unit(str(name or ""), str(desc or ""), raw_sample)
        )

        # Złożenie struktury powiatów
        dane_powiaty: Dict[str, Dict[str, Optional[float]]] = {}
        measurements: List[Dict[str, Any]] = []

        all_regions = set()
        for yr_dict in data_by_year.values():
            all_regions.update(yr_dict.keys())

        for reg in sorted(list(all_regions)):
            dane_powiaty[reg] = {}
            powiat_id = RAW_NAME_TO_POWIAT_ID.get(reg)
            for y in sorted_years:
                val = data_by_year.get(y, {}).get(reg)
                dane_powiaty[reg][y] = val
                if val is not None:
                    measurements.append({
                        "powiat_name": reg,
                        "powiat_id": powiat_id,
                        "year": int(y),
                        "val": float(val),
                        "unit": unit,
                    })

        return {
            "name": name,
            "unit": unit,
            "description": desc,
            "source": source,
            "years": sorted_years,
            "dane_powiaty": dane_powiaty,
            "measurements": measurements,
        }


# ==============================================================================
# INTEGRACJA Z SUPABASE (REST API & UPSERT)
# ==============================================================================
def get_supabase_rest_config() -> Tuple[Optional[str], Optional[Dict[str, str]]]:
    """Wczytuje konfigurację połączenia z Supabase z pliku .env."""
    load_dotenv()
    url = os.getenv("SUPABASE_URL", "").strip().rstrip("/")
    if url.endswith("/rest/v1"):
        url = url[:-len("/rest/v1")]
    key = os.getenv("SUPABASE_KEY", "").strip()

    if not url or not key:
        return None, None

    rest_url = f"{url}/rest/v1"
    headers = {
        "apikey": key,
        "Authorization": f"Bearer {key}",
        "Content-Type": "application/json",
        "Prefer": "resolution=merge-duplicates",
    }
    return rest_url, headers


def sync_categories_to_supabase(
    categories: List[Dict[str, Any]], rest_url: str, headers: Dict[str, str]
) -> int:
    """Zapisuje kategorie do tabeli indicator_categories (z fallbackiem przy braku kolumny color)."""
    saved = 0
    supports_color = True

    for cat in categories:
        payload = {
            "id": cat["id"],
            "name": cat["name"][:100],
            "description": cat.get("description", ""),
            "icon": cat.get("icon", "activity")[:50],
            "sort_order": cat.get("sort_order", 0),
        }
        if supports_color and "color" in cat:
            payload["color"] = cat["color"][:50]

        r = requests.post(f"{rest_url}/indicator_categories?on_conflict=id", headers=headers, json=payload)

        # Fallback jeśli kolumna 'color' nie została jeszcze dodana w bazie zdalnej
        if r.status_code == 400 and "PGRST204" in r.text and "color" in r.text:
            supports_color = False
            del payload["color"]
            r = requests.post(f"{rest_url}/indicator_categories?on_conflict=id", headers=headers, json=payload)

        if r.status_code in (200, 201):
            saved += 1
        else:
            logger.warning(f"Błąd zapisu kategorii '{cat['id']}': {r.status_code} - {r.text}")

    if not supports_color:
        logger.info(
            "Kolumna 'color' w 'indicator_categories' nie istnieje w bazie Supabase. "
            "Aby zapisać kolory w Supabase, uruchom SQL z backend/supabase_indicators_schema.sql."
        )

    return saved


def sync_indicators_to_supabase(
    indicators: List[Dict[str, Any]], rest_url: str, headers: Dict[str, str]
) -> int:
    """Zapisuje definicje wskaźników do tabeli indicators."""
    saved = 0
    supports_source = True

    for ind in indicators:
        payload = {
            "id": ind["id"][:64],
            "category_id": ind.get("category_id", "")[:64] if ind.get("category_id") else None,
            "name": ind["name"][:255],
            "unit": (ind.get("unit") or "")[:32],
            "description": ind.get("description", ""),
        }
        if supports_source and ind.get("source"):
            # Kolumna source w PostgREST ma varchar(100)
            payload["source"] = ind["source"][:100]

        r = requests.post(f"{rest_url}/indicators?on_conflict=id", headers=headers, json=payload)
        if r.status_code == 400 and "PGRST204" in r.text and "source" in r.text:
            supports_source = False
            del payload["source"]
            r = requests.post(f"{rest_url}/indicators?on_conflict=id", headers=headers, json=payload)

        if r.status_code in (200, 201):
            saved += 1
        else:
            logger.warning(f"Błąd zapisu wskaźnika '{ind['id']}': {r.status_code} - {r.text}")
    return saved


def sync_measurements_to_supabase(
    measurements: List[Dict[str, Any]], rest_url: str, headers: Dict[str, str], batch_size: int = 200
) -> int:
    """Zapisuje rekordy pomiarów partiami do tabeli indicator_measurements."""
    total_saved = 0
    for i in range(0, len(measurements), batch_size):
        batch = measurements[i:i + batch_size]
        clean_batch = []
        for m in batch:
            clean_batch.append({
                "indicator_id": str(m["indicator_id"])[:64],
                "powiat_name": str(m["powiat_name"])[:100],
                "powiat_id": str(m.get("powiat_id") or "")[:50] or None,
                "year": int(m["year"]),
                "val": float(m["val"]),
                "unit": (str(m.get("unit") or ""))[:20],
            })

        r = requests.post(
            f"{rest_url}/indicator_measurements?on_conflict=indicator_id,powiat_name,year",
            headers=headers,
            json=clean_batch,
        )
        if r.status_code in (200, 201):
            total_saved += len(clean_batch)
        else:
            logger.warning(f"Błąd partii pomiarów ({len(clean_batch)} rekordów): {r.status_code} - {r.text}")
    return total_saved


# ==============================================================================
# GŁÓWNA PROCEDURA SCRAPOWANIA I SYNCHRONIZACJI
# ==============================================================================
def run_scraper(
    target_years: List[str],
    core_only: bool = False,
    selected_categories: Optional[List[str]] = None,
    selected_pointers: Optional[List[int]] = None,
    save_db: bool = True,
    output_json: str = "visualize_data.json",
    workers: int = 8,
):
    start_time = time.time()
    scraper = RopsObserwatorScraper(workers=workers)

    logger.info("=" * 70)
    logger.info("ROZPOCZĘCIE SCRAPOWANIA: ROPS KRAKÓW OBSERWATOR")
    logger.info(f"Lata analizy: {target_years[0]} – {target_years[-1]}")
    logger.info(f"Tryb: {'Tylko główne wskaźniki (core)' if core_only else 'Wszystkie wskaźniki z menu'}")
    logger.info("=" * 70)

    # 1. Pobierz strukturę kategorii i wskaźników
    categories_tree = scraper.discover_categories_and_indicators()
    if not categories_tree:
        logger.error("Brak kategorii do przetworzenia.")
        return

    # Przygotowanie listy wskaźników do zescrapowania
    to_scrape: List[Dict[str, Any]] = []

    if core_only:
        # Tylko 14 zdefiniowanych w CORE_INDICATORS_MAPPING
        for pid, meta in CORE_INDICATORS_MAPPING.items():
            to_scrape.append({
                "pointer_id": pid,
                "key": meta["key"],
                "category_id": meta["category_id"],
                "name": meta["name"],
                "known_meta": meta,
            })
    else:
        for cat in categories_tree:
            cat_id = cat["id"]
            if selected_categories and cat_id not in selected_categories:
                continue

            for ptr in cat["pointers"]:
                pid = ptr["pointer_id"]
                if selected_pointers and pid not in selected_pointers:
                    continue

                known = CORE_INDICATORS_MAPPING.get(pid)
                key = known["key"] if known else slugify(ptr["name"])

                to_scrape.append({
                    "pointer_id": pid,
                    "key": key,
                    "category_id": cat_id,
                    "name": ptr["name"],
                    "known_meta": known,
                })

    logger.info(f"Do pobrania wybrano: {len(to_scrape)} wskaźników.")

    # 2. Pobieranie szeregów czasowych
    scraped_indicators_json: Dict[str, Any] = {}
    db_indicators_list: List[Dict[str, Any]] = []
    all_measurements: List[Dict[str, Any]] = []

    for idx, item in enumerate(to_scrape, 1):
        pid = item["pointer_id"]
        key = item["key"]
        cat_id = item["category_id"]

        logger.info(f"[{idx}/{len(to_scrape)}] Scrapowanie wskaźnika: '{item['name']}' (ID: {pid} -> '{key}')...")

        res = scraper.scrape_indicator_time_series(
            pointer_id=pid,
            target_years=target_years,
            known_meta=item.get("known_meta"),
        )

        if not res["years"]:
            logger.warning(f"  Brak danych dla wskaźnika ID {pid} w podanych latach.")
            continue

        cat_info = CATEGORY_METADATA.get(cat_id, {})

        # Do formatu visualize_data.json
        scraped_indicators_json[key] = {
            "name": res["name"],
            "unit": res["unit"],
            "description": res["description"],
            "category": cat_info.get("name", cat_id),
            "category_id": cat_id,
            "color": cat_info.get("color", "#698B99"),
            "source": res["source"],
            "years": res["years"],
            "dane_powiaty": res["dane_powiaty"],
        }

        # Do bazy danych wskaźników
        db_indicators_list.append({
            "id": key,
            "category_id": cat_id,
            "name": res["name"],
            "unit": res["unit"],
            "description": res["description"],
            "source": res["source"],
        })

        for m in res["measurements"]:
            m["indicator_id"] = key
            all_measurements.append(m)

        logger.info(
            f"  ✓ Zescrapowano: {len(res['years'])} lat, {len(res['measurements'])} pomiarów, jednostka: '{res['unit']}'"
        )

    # 3. Zapis do lokalnego pliku JSON
    base_dir = Path(__file__).resolve().parent
    out_path = Path(output_json)
    if not out_path.is_absolute():
        out_path = base_dir / output_json

    # Jeśli plik już istnieje, połącz nowe dane ze starymi
    if out_path.exists():
        try:
            with open(out_path, "r", encoding="utf-8") as f:
                existing_data = json.load(f)
            existing_data.update(scraped_indicators_json)
            final_json = existing_data
        except Exception:
            final_json = scraped_indicators_json
    else:
        final_json = scraped_indicators_json

    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(final_json, f, ensure_ascii=False, indent=2)
    logger.info(f"✓ Zapisano dane wskaźników do pliku: {out_path} ({len(final_json)} wskaźników)")

    # Zapis pliku z metadanymi kategorii do JSON
    cat_json_path = base_dir / "indicator_categories.json"
    with open(cat_json_path, "w", encoding="utf-8") as f:
        json.dump(categories_tree, f, ensure_ascii=False, indent=2)
    logger.info(f"✓ Zapisano kategorie wskaźników z kolorami do pliku: {cat_json_path}")

    # 4. Synchronizacja z bazą Supabase
    if save_db:
        rest_url, headers = get_supabase_rest_config()
        if not rest_url or not headers:
            logger.warning("Brak skonfigurowanych kluczy Supabase w .env - pomijam synchronizację z bazą.")
        else:
            logger.info("-" * 60)
            logger.info("SYNCHRONIZACJA Z BAZĄ DANYCH SUPABASE...")

            # 4.1 Kategorie
            cat_count = sync_categories_to_supabase(categories_tree, rest_url, headers)
            logger.info(f"  ✓ Zapisano kategorii: {cat_count}/{len(categories_tree)}")

            # 4.2 Wskaźniki
            ind_count = sync_indicators_to_supabase(db_indicators_list, rest_url, headers)
            logger.info(f"  ✓ Zapisano wskaźników: {ind_count}/{len(db_indicators_list)}")

            # 4.3 Pomiary
            meas_count = sync_measurements_to_supabase(all_measurements, rest_url, headers, batch_size=250)
            logger.info(f"  ✓ Zapisano punktów pomiarowych: {meas_count}/{len(all_measurements)}")

    elapsed = time.time() - start_time
    logger.info("=" * 70)
    logger.info(f"SCRAPOWANIE ZAKOŃCZONE W {elapsed:.2f} SEKUND.")
    logger.info(f"Łącznie wskaźników: {len(scraped_indicators_json)}")
    logger.info(f"Łącznie pomiarów: {len(all_measurements)}")
    logger.info("=" * 70)


def main():
    parser = argparse.ArgumentParser(
        description="Scraper danych statystycznych z Obserwatora ROPS Kraków do bazy wskaźników."
    )
    parser.add_argument(
        "--core",
        action="store_true",
        help="Scrapuj tylko 14 głównych wskaźników wykorzystywanych w wizualizacjach (szybki tryb)",
    )
    parser.add_argument(
        "--start-year",
        type=int,
        default=2014,
        help="Rok początkowy analizy (domyślnie: 2014)",
    )
    parser.add_argument(
        "--end-year",
        type=int,
        default=2024,
        help="Rok końcowy analizy (domyślnie: 2024)",
    )
    parser.add_argument(
        "-o",
        "--output",
        type=str,
        default="visualize_data.json",
        help="Nazwa pliku wyjściowego JSON (domyślnie: visualize_data.json)",
    )
    parser.add_argument(
        "--category",
        type=str,
        default="",
        help="Scrapuj wskaźniki tylko z podanej kategorii (np. 'ludnosc', 'rodzina', 'rynek_pracy')",
    )
    parser.add_argument(
        "--pointers",
        type=str,
        default="",
        help="Lista ID wskaźników oddzielona przecinkami (np. '4,56,186')",
    )
    parser.add_argument(
        "--workers",
        type=int,
        default=8,
        help="Liczba równoległych wątków sieciowych (domyślnie: 8)",
    )
    parser.add_argument(
        "--no-db",
        action="store_true",
        help="Nie zapisuj danych do Supabase (tylko zrzut do pliku JSON)",
    )

    args = parser.parse_args()

    target_years = [str(y) for y in range(args.start_year, args.end_year + 1)]
    selected_cats = [args.category.strip().lower()] if args.category.strip() else None
    selected_ptrs = [int(p.strip()) for p in args.pointers.split(",") if p.strip().isdigit()] if args.pointers.strip() else None

    run_scraper(
        target_years=target_years,
        core_only=args.core,
        selected_categories=selected_cats,
        selected_pointers=selected_ptrs,
        save_db=not args.no_db,
        output_json=args.output,
        workers=args.workers,
    )


if __name__ == "__main__":
    main()
