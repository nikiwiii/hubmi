import json
import logging
import re
import unicodedata
from pathlib import Path
from typing import Dict, Any, List, Optional, Tuple

from config import GROQ_API_KEY, GROQ_MODEL
from supabase_client import DatabaseRepository
from matching.embeddings import compute_embedding, cosine_similarity

logger = logging.getLogger("hubmi.indicators.rag")

# Słownik zmapowanych powiatów Małopolski (klucz unikalny -> nazwy i odmiany fleksyjne)
POWIATY_MAPPING = {
    "krakowski": {
        "id": "krakowski",
        "name": "powiat krakowski",
        "display_name": "Powiat Krakowski",
        "is_city": False,
        "keywords": ["krakowskim", "krakowski", "krakowskiego", "krakowskie", "powiecie krakowskim", "ziemski krakowski"]
    },
    "krakow": {
        "id": "krakow",
        "name": "powiat m. Kraków",
        "display_name": "Kraków (miasto)",
        "is_city": True,
        "keywords": ["krakow", "kraków", "krakowie", "krakowa", "m. kraków", "miasto kraków", "m. krakow"]
    },
    "bochenski": {
        "id": "bochenski",
        "name": "powiat bocheński",
        "display_name": "Powiat Bocheński",
        "is_city": False,
        "keywords": ["bocheński", "bochenski", "bochnia", "bochni", "bocheńskim", "bochenskim"]
    },
    "brzeski": {
        "id": "brzeski",
        "name": "powiat brzeski",
        "display_name": "Powiat Brzeski",
        "is_city": False,
        "keywords": ["brzeski", "brzesku", "brzeskim", "brzeskiego", "brzesko"]
    },
    "chrzanowski": {
        "id": "chrzanowski",
        "name": "powiat chrzanowski",
        "display_name": "Powiat Chrzanowski",
        "is_city": False,
        "keywords": ["chrzanowski", "chrzanowie", "chrzanowskim", "chrzanów", "chrzanow"]
    },
    "dabrowski": {
        "id": "dabrowski",
        "name": "powiat dąbrowski",
        "display_name": "Powiat Dąbrowski",
        "is_city": False,
        "keywords": ["dąbrowski", "dabrowski", "dąbrowie", "dabrowskim", "dąbrowa tarnowska", "dabrowska"]
    },
    "gorlicki": {
        "id": "gorlicki",
        "name": "powiat gorlicki",
        "display_name": "Powiat Gorlicki",
        "is_city": False,
        "keywords": ["gorlicki", "gorlicach", "gorlickim", "gorlice"]
    },
    "limanowski": {
        "id": "limanowski",
        "name": "powiat limanowski",
        "display_name": "Powiat Limanowski",
        "is_city": False,
        "keywords": ["limanowski", "limanowej", "limanowskim", "limanowa"]
    },
    "nowy-sacz": {
        "id": "nowy-sacz",
        "name": "powiat m. Nowy Sącz",
        "display_name": "Nowy Sącz (miasto)",
        "is_city": True,
        "keywords": ["nowy sącz", "nowym sączu", "nowego sącza", "nowy sacz", "m. nowy sącz"]
    },
    "nowosadecki": {
        "id": "nowosadecki",
        "name": "powiat nowosądecki",
        "display_name": "Powiat Nowosądecki",
        "is_city": False,
        "keywords": ["nowosądecki", "nowosadecki", "nowosądeckim", "nowosadeckim"]
    },
    "nowotarski": {
        "id": "nowotarski",
        "name": "powiat nowotarski",
        "display_name": "Powiat Nowotarski",
        "is_city": False,
        "keywords": ["nowotarski", "nowym targu", "nowotarskim", "nowy targ"]
    },
    "miechowski": {
        "id": "miechowski",
        "name": "powiat miechowski",
        "display_name": "Powiat Miechowski",
        "is_city": False,
        "keywords": ["miechowski", "miechowie", "miechowskim", "miechów", "miechow"]
    },
    "myslenicki": {
        "id": "myslenicki",
        "name": "powiat myślenicki",
        "display_name": "Powiat Myślenicki",
        "is_city": False,
        "keywords": ["myślenicki", "myslenicki", "myślenicach", "myslenicach", "myślenickim", "myślenice"]
    },
    "olkuski": {
        "id": "olkuski",
        "name": "powiat olkuski",
        "display_name": "Powiat Olkuski",
        "is_city": False,
        "keywords": ["olkuski", "olkuszu", "olkuskim", "olkusz"]
    },
    "oswiecimski": {
        "id": "oswiecimski",
        "name": "powiat oświęcimski",
        "display_name": "Powiat Oświęcimski",
        "is_city": False,
        "keywords": ["oświęcimski", "oswiecimski", "oświęcimiu", "oswiecimiu", "oświęcimskim", "oświęcim"]
    },
    "proszowicki": {
        "id": "proszowicki",
        "name": "powiat proszowicki",
        "display_name": "Powiat Proszowicki",
        "is_city": False,
        "keywords": ["proszowicki", "proszowicach", "proszowickim", "proszowice"]
    },
    "suski": {
        "id": "suski",
        "name": "powiat suski",
        "display_name": "Powiat Suski",
        "is_city": False,
        "keywords": ["suski", "suskim", "sucha beskidzka", "suchej beskidzkiej"]
    },
    "tarnow": {
        "id": "tarnow",
        "name": "powiat m. Tarnów",
        "display_name": "Tarnów (miasto)",
        "is_city": True,
        "keywords": ["tarnów", "tarnowie", "tarnowa", "tarnow", "m. tarnów", "miasto tarnów"]
    },
    "tarnowski": {
        "id": "tarnowski",
        "name": "powiat tarnowski",
        "display_name": "Powiat Tarnowski",
        "is_city": False,
        "keywords": ["tarnowski", "tarnowskim", "tarnowskiego"]
    },
    "tatrzanski": {
        "id": "tatrzanski",
        "name": "powiat tatrzański",
        "display_name": "Powiat Tatrzański",
        "is_city": False,
        "keywords": ["tatrzański", "tatrzanski", "zakopane", "zakopanem", "tatrzańskim", "tatrzanskim", "podhale"]
    },
    "wadowicki": {
        "id": "wadowicki",
        "name": "powiat wadowicki",
        "display_name": "Powiat Wadowicki",
        "is_city": False,
        "keywords": ["wadowicki", "wadowicach", "wadowickim", "wadowice"]
    },
    "wielicki": {
        "id": "wielicki",
        "name": "powiat wielicki",
        "display_name": "Powiat Wielicki",
        "is_city": False,
        "keywords": ["wielicki", "wieliczce", "wielickim", "wieliczka"]
    }
}

# Domenowe reguły dopasowania tematycznego (słowa kluczowe -> wskaźniki i wagi)
TOPIC_INDICATOR_MAPPINGS = [
    {
        "category": "Niepełnosprawność i Dostępność",
        "keywords": [
            "wózek", "wozek", "wózkach", "wozkach", "niepełnosprawn", "niepelnosprawn", "inwalid",
            "ruchow", "narząd ruchu", "barier", "dostępn", "podjazd", "schodołaz", "asystent",
            "poruszani", "wózkowicz", "paraliż", "rehabilitac"
        ],
        "indicators": [
            {"id": "severe_disability_share", "weight": 1.0, "reason": "Udział osób ze znacznym stopniem niepełnosprawności (w tym osób poruszających się na wózkach)."},
            {"id": "disability_support_share", "weight": 0.95, "reason": "Wskaźnik pomocy społecznej z powodu niepełnosprawności w powiecie."},
            {"id": "total_disability_share", "weight": 0.85, "reason": "Ogólny odsetek osób z orzeczeniem o niepełnosprawności w populacji."},
            {"id": "residents_per_social_worker", "weight": 0.5, "reason": "Dostępność kadr socjalnych wspierających osoby z niepełnosprawnościami."}
        ]
    },
    {
        "category": "Seniorzy i Starzenie się",
        "keywords": [
            "senior", "starsz", "emeryt", "starości", "wiek podeszły", "babci", "dziadk",
            "opieka", "wytchnieniow", "dps", "dom opieki", "samotn"
        ],
        "indicators": [
            {"id": "disability_support_share", "weight": 0.8, "reason": "Wsparcie dla seniorów z niepełnosprawnościami i ograniczeniami sprawności."},
            {"id": "average_hospital_stay", "weight": 0.75, "reason": "Hospitalizacja i potrzeby opiekuńczo-lecznicze seniorów."},
            {"id": "residents_per_social_worker", "weight": 0.7, "reason": "Dostępność pracowników socjalnych dla osób starszych."},
            {"id": "cash_social_assistance_benefits", "weight": 0.65, "reason": "Świadczenia dochodowe dla najuboższych emerytów."}
        ]
    },
    {
        "category": "Rynek Pracy i Ubóstwo",
        "keywords": [
            "praca", "bezroboci", "zatrudnien", "staż", "kwalifikacj", "aktywizacj",
            "pieniądz", "zarob", "ubóstw", "bied", "dochod", "zasiłek"
        ],
        "indicators": [
            {"id": "unemployed_longer_than_1_year", "weight": 0.95, "reason": "Długotrwałe bezrobocie i wykluczenie z rynku pracy."},
            {"id": "working_age_population", "weight": 0.8, "reason": "Potencjał demograficzny i zasoby ludzkie w wieku produkcyjnym."},
            {"id": "cash_social_assistance_benefits", "weight": 0.85, "reason": "Zasiłki i świadczenia socjalne z powodu braku środków do życia."},
            {"id": "municipal_budget_expenditures", "weight": 0.6, "reason": "Nakłady budżetowe gmin na mieszkańca."}
        ]
    },
    {
        "category": "Zdrowie i Opieka Medyczna",
        "keywords": [
            "zdrowi", "szpital", "nowotwór", "rak", "lekarz", "medycyn", "apteka", "leczenie", "chorob"
        ],
        "indicators": [
            {"id": "average_hospital_stay", "weight": 0.95, "reason": "Średni czas hospitalizacji i obciążenie łóżek szpitalnych."},
            {"id": "cancer_incidence", "weight": 0.9, "reason": "Zapadalność na choroby nowotworowe w powiecie."},
            {"id": "pharmacy_availability", "weight": 0.8, "reason": "Dostępność placówek aptecznych na terenie powiatu."}
        ]
    },
    {
        "category": "Rodzina i Piecza Zastępcza",
        "keywords": [
            "rodzin", "zastępcz", "dziec", "wychowawcz", "przedszkol", "wielodzietn", "maluch", "sierot"
        ],
        "indicators": [
            {"id": "foster_families_count", "weight": 0.95, "reason": "Liczba aktywnych rodzin zastępczych w powiecie."},
            {"id": "care_and_education_centers", "weight": 0.9, "reason": "Instytucjonalne placówki opiekuńczo-wychowawcze."},
            {"id": "kindergarten_availability", "weight": 0.85, "reason": "Miejsca w przedszkolach dla dzieci w wieku 3–5 lat."},
            {"id": "large_families_share", "weight": 0.8, "reason": "Udział rodzin wielodzietnych w strukturze społecznej."}
        ]
    }
]


def strip_accents_simple(text: str) -> str:
    """Usuwa znaki diakrytyczne dla elastycznego porównywania."""
    text = text.replace("ł", "l").replace("Ł", "L")
    return "".join(c for c in unicodedata.normalize("NFD", text) if unicodedata.category(c) != "Mn").lower()


def detect_powiat(query: str, preferred_powiat_id: Optional[str] = None) -> Tuple[Optional[Dict[str, Any]], str]:
    """Wykrywa powiat w zapytaniu użytkownika lub stosuje preferowany."""
    if preferred_powiat_id and preferred_powiat_id in POWIATY_MAPPING:
        return POWIATY_MAPPING[preferred_powiat_id], "explicit"

    q_lower = query.lower()
    q_clean = strip_accents_simple(query)

    # 1. Specjalny test dla "powiat krakowski" vs "krakow"
    if "powiat krakow" in q_clean or "powiecie krakow" in q_clean or "powiatu krakow" in q_clean or "ziemski krakow" in q_clean:
        return POWIATY_MAPPING["krakowski"], "detected"

    # 2. Sprawdzenie fraz dla każdego powiatu
    for p_id, p_info in POWIATY_MAPPING.items():
        for kw in p_info["keywords"]:
            kw_clean = strip_accents_simple(kw)
            pattern = r"\b" + re.escape(kw_clean) + r"\b"
            if re.search(pattern, q_clean):
                return p_info, "detected"

    # Domyślnie brak specyficznego powiatu
    return None, "none"


def detect_topics(query: str) -> List[Dict[str, Any]]:
    """Identyfikuje tematy społeczne i powiązane wskaźniki."""
    q_clean = strip_accents_simple(query)
    detected_indicators: Dict[str, Dict[str, Any]] = {}

    for mapping in TOPIC_INDICATOR_MAPPINGS:
        matches = 0
        matched_words = []
        for kw in mapping["keywords"]:
            kw_clean = strip_accents_simple(kw)
            if kw_clean in q_clean:
                matches += 1
                matched_words.append(kw)

        if matches > 0:
            for ind in mapping["indicators"]:
                ind_id = ind["id"]
                score = ind["weight"] * min(1.0, 0.6 + matches * 0.2)
                if ind_id not in detected_indicators or detected_indicators[ind_id]["score"] < score:
                    detected_indicators[ind_id] = {
                        "id": ind_id,
                        "category": mapping["category"],
                        "score": score,
                        "reason": ind["reason"],
                        "matched_words": matched_words
                    }

    sorted_indicators = sorted(detected_indicators.values(), key=lambda x: x["score"], reverse=True)
    return sorted_indicators


def load_indicators_data() -> Dict[str, Any]:
    """Wczytuje zaktualizowany plik visualize_data.json."""
    candidates = [
        Path(__file__).resolve().parent.parent / "visualize_data.json",
        Path(__file__).resolve().parent.parent.parent / "front" / "app" / "lib" / "visualize_data.json"
    ]
    for p in candidates:
        if p.exists():
            try:
                with open(p, "r", encoding="utf-8") as f:
                    return json.load(f)
            except Exception as e:
                logger.error(f"Error loading {p}: {e}")
    return {}


class KnowledgeRagService:
    @classmethod
    def execute_rag(cls, query: str, preferred_powiat_id: Optional[str] = None) -> Dict[str, Any]:
        """
        Główny silnik RAG dla Raportów i Zasobnika Badań Społecznych:
        1. Ekstrakcja powiatu (np. Powiat Krakowski).
        2. Ekstrakcja tematów (np. osoby na wózkach -> niepełnosprawność).
        3. Pobranie danych wskaźników z bazy ROPS.
        4. Wyszukanie innowacji z bazy 115 projektów ROPS.
        5. Synteza analityczna przez LLM Groq (lub inteligentny generator deterministyczny).
        6. Przygotowanie serii czasowych i wykresów do wizualizacji.
        """
        all_data = load_indicators_data()

        # 1. Rozpoznanie powiatu
        detected_powiat_info, powiat_match_type = detect_powiat(query, preferred_powiat_id)
        if not detected_powiat_info:
            # Fallback na Powiat Krakowski jeśli zapytanie pyta o wózki bez powiatu lub domyślny region
            if any(w in query.lower() for w in ["wózk", "wozk", "krakow", "niepełnosprawn"]):
                detected_powiat_info = POWIATY_MAPPING["krakowski"]
            else:
                detected_powiat_info = POWIATY_MAPPING["krakowski"]

        powiat_raw_name = detected_powiat_info["name"]
        powiat_display_name = detected_powiat_info["display_name"]
        powiat_id = detected_powiat_info["id"]

        # 2. Rozpoznanie tematów i wskaźników
        matched_topic_entries = detect_topics(query)
        if not matched_topic_entries:
            # Domyślne wskaźniki przy zapytaniu ogólnym
            matched_topic_entries = [
                {"id": "severe_disability_share", "category": "Niepełnosprawność", "score": 0.95, "reason": "Osoby ze znacznym stopniem niepełnosprawności i na wózkach."},
                {"id": "disability_support_share", "category": "Niepełnosprawność", "score": 0.9, "reason": "Pomoc społeczna dla osób z niepełnosprawnościami."},
                {"id": "total_disability_share", "category": "Niepełnosprawność", "score": 0.85, "reason": "Wskaźnik orzeczeń o niepełnosprawności w populacji."}
            ]

        # 3. Zgromadzenie danych statystycznych dla pasujących wskaźników
        reports_summary: List[Dict[str, Any]] = []

        for item in matched_topic_entries:
            ind_id = item["id"]
            ind_info = all_data.get(ind_id)
            if not ind_info:
                continue

            years = ind_info.get("years", [])
            unit = ind_info.get("unit", "")
            dane_powiaty = ind_info.get("dane_powiaty", {})
            powiat_series = dane_powiaty.get(powiat_raw_name, {})

            # Oblicz wartości dla powiatu
            latest_year = years[-1] if years else ""
            first_year = years[0] if years else ""
            latest_powiat_val = powiat_series.get(latest_year, 0.0) if latest_year else 0.0
            first_powiat_val = powiat_series.get(first_year, 0.0) if first_year else 0.0

            delta = round(latest_powiat_val - first_powiat_val, 2) if len(years) > 1 else 0.0

            # Oblicz średnią regionalną w najnowszym roku
            all_vals_latest = [
                p_dict.get(latest_year, 0.0)
                for p_dict in dane_powiaty.values()
                if p_dict.get(latest_year) is not None
            ]
            region_avg_latest = round(sum(all_vals_latest) / len(all_vals_latest), 2) if all_vals_latest else 0.0

            # Oblicz pozycję (ranking) powiatu
            ranked = sorted(
                [(p_name, p_dict.get(latest_year, 0.0)) for p_name, p_dict in dane_powiaty.items()],
                key=lambda x: x[1],
                reverse=True
            )
            rank = next((idx + 1 for idx, (p_name, _) in enumerate(ranked) if p_name == powiat_raw_name), 1)

            # Serie czasowe do wykresów
            time_series = []
            for y in years:
                val = powiat_series.get(y)
                if val is not None:
                    time_series.append({"year": y, "value": val})

            reports_summary.append({
                "id": ind_id,
                "title": ind_info.get("name", ind_id),
                "category": item["category"],
                "unit": unit,
                "description": ind_info.get("description", ""),
                "latest_year": latest_year,
                "latest_value": latest_powiat_val,
                "first_value": first_powiat_val,
                "delta": delta,
                "region_avg": region_avg_latest,
                "rank": rank,
                "total_powiats": len(dane_powiaty) or 22,
                "reason": item["reason"],
                "time_series": time_series
            })

        # Wybierz główny wskaźnik do wykresu czasowego (najlepiej z wieloma latami pomiarów)
        primary_report = None
        for r in reports_summary:
            if len(r["time_series"]) > 1:
                primary_report = r
                break
        if not primary_report and reports_summary:
            primary_report = reports_summary[0]

        # 4. Przygotowanie danych do interaktywnych wykresów
        chart_data: Dict[str, Any] = {}
        if primary_report:
            p_ind = all_data.get(primary_report["id"], {})
            years = p_ind.get("years", [])
            dane_p = p_ind.get("dane_powiaty", {})
            pow_series = dane_p.get(powiat_raw_name, {})

            # Wykres liniowy trendu (Powiat vs Średnia Małopolski)
            trend_chart = []
            for y in years:
                # Oblicz regionalną średnią w roku y
                vals_y = [d.get(y) for d in dane_p.values() if d.get(y) is not None]
                avg_y = round(sum(vals_y) / len(vals_y), 2) if vals_y else 0.0
                p_val = pow_series.get(y)
                trend_chart.append({
                    "year": y,
                    "powiatValue": p_val,
                    "regionAvg": avg_y
                })

            # Wykres słupkowy porównawczy w najnowszym roku (Powiat vs m. Kraków vs Średnia vs Sąsiedzi)
            latest_y = primary_report["latest_year"]
            all_ranked_latest = sorted(
                [
                    {
                        "powiatId": next((pid for pid, pinfo in POWIATY_MAPPING.items() if pinfo["name"] == pname), pname),
                        "name": pname.replace("powiat ", "").capitalize(),
                        "value": round(pdict.get(latest_y, 0.0), 2)
                    }
                    for pname, pdict in dane_p.items()
                ],
                key=lambda x: x["value"],
                reverse=True
            )

            chart_data = {
                "report_id": primary_report["id"],
                "report_title": primary_report["title"],
                "unit": primary_report["unit"],
                "latest_year": latest_y,
                "trend_series": trend_chart,
                "comparison_bars": all_ranked_latest[:8]  # Top 8 lub sąsiedzi
            }

        # 5. Wyszukanie innowacji z bazy ROPS
        all_innovations = DatabaseRepository.get_all_innovations()
        matched_innovations = cls._match_innovations_for_query(query, all_innovations)

        # 6. Dedykowany ekspert ROPS
        expert_info = {
            "name": "inż. Paweł Zieliński",
            "title": "Koordynator Dostępności i Likwidacji Barier",
            "department": "Ośrodek Dostępności Przestrzennej ROPS Kraków",
            "specialization": "Likwidacja barier architektonicznych, audyty dostępności, innowacje transportowe dla osób na wózkach",
            "chat_url": "/chat?topic=Dostepnosc-i-wozki-powiat-krakowski"
        }

        # 7. Generowanie syntezy AI RAG
        ai_synthesis = cls._generate_ai_synthesis(
            query=query,
            powiat_name=powiat_display_name,
            reports=reports_summary,
            innovations=matched_innovations,
            expert=expert_info
        )

        return {
            "success": True,
            "query": query,
            "detected_powiat": {
                "id": powiat_id,
                "name": powiat_raw_name,
                "display_name": powiat_display_name,
                "is_city": detected_powiat_info.get("is_city", False)
            },
            "detected_topics": [t["category"] for t in matched_topic_entries[:3]],
            "ai_synthesis": ai_synthesis,
            "primary_report": primary_report,
            "matched_reports": reports_summary,
            "chart_data": chart_data,
            "matched_innovations": matched_innovations,
            "matched_expert": expert_info
        }

    @classmethod
    def _match_innovations_for_query(cls, query: str, innovations: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Dopasowuje najbardziej trafne innowacje z bazy ROPS Kraków."""
        q_lower = query.lower()
        scored = []

        is_wheelchair = any(w in q_lower for w in ["wózk", "wozk", "niepełnosprawn", "ruchow", "barier", "dostępn"])

        for inn in innovations:
            title = inn.get("title", "")
            desc = inn.get("description", "")
            problems = inn.get("addressed_problems", "")
            full_text = f"{title} {desc} {problems}".lower()

            score = 0
            if is_wheelchair:
                if any(w in full_text for w in ["wózk", "wozk", "wózek", "wozek"]):
                    score += 50
                if any(w in full_text for w in ["niepełnosprawn", "ruchow", "barier"]):
                    score += 30
                if any(w in full_text for w in ["dostępn", "rampa", "transport", "podjazd"]):
                    score += 20
            else:
                for word in q_lower.split():
                    if len(word) >= 4 and word in full_text:
                        score += 15

            if score > 0:
                raw_url = inn.get("url")
                clean_url = raw_url if (raw_url and raw_url.startswith("http")) else None
                scored.append({
                    "id": str(inn.get("id")),
                    "title": title,
                    "description": desc,
                    "addressed_problems": problems,
                    "funding_info": inn.get("funding_info"),
                    "url": clean_url,
                    "score": score
                })

        scored.sort(key=lambda x: x["score"], reverse=True)
        return scored[:4]

    @classmethod
    def _generate_ai_synthesis(
        cls,
        query: str,
        powiat_name: str,
        reports: List[Dict[str, Any]],
        innovations: List[Dict[str, Any]],
        expert: Dict[str, Any]
    ) -> str:
        """Generuje merytoryczną, wyczerpującą syntezę RAG w języku polskim z odwołaniem do liczb."""
        stats_lines = []
        for r in reports:
            delta_str = f"+{r['delta']}" if r['delta'] > 0 else str(r['delta'])
            stats_lines.append(
                f"- **{r['title']}**: w {powiat_name} wynosi **{r['latest_value']} {r['unit']}** (rok {r['latest_year']}), "
                f"podczas gdy średnia dla Małopolski to {r['region_avg']} {r['unit']}. "
                f"Pozycja w województwie: **{r['rank']}. miejsce** na {r['total_powiats']} powiatów (zmiana: {delta_str} {r['unit']})."
            )

        inn_lines = []
        for i in innovations[:3]:
            inn_lines.append(f"- **{i['title']}**: {i['description'][:140]}...")

        # Próba wywołania Groq
        if GROQ_API_KEY:
            try:
                from groq import Groq
                client = Groq(api_key=GROQ_API_KEY, timeout=6.0, max_retries=0)

                prompt = (
                    f"Jesteś Doradcą Analitycznym ROPS Kraków w systemie Hubmi. "
                    f"Użytkownik zadał pytanie analityczne: \"{query}\".\n\n"
                    f"OBSZAR: {powiat_name}\n\n"
                    f"OFICJALNE DANE ZE STATYSTYK SPOŁECZNYCH ROPS KRAKÓW DLA TEGO POWIATU:\n"
                    f"{chr(10).join(stats_lines)}\n\n"
                    f"POWIĄZANE INNOWACJE SPOŁECZNE ROPS KRAKÓW:\n"
                    f"{chr(10).join(inn_lines)}\n\n"
                    f"EKSPERT DS. WSPARCIA: {expert['name']} ({expert['specialization']}).\n\n"
                    f"ZADANIE:\n"
                    f"Sformułuj rzetelną, przejrzystą i profesjonalną odpowiedź w formacie Markdown dla użytkownika. "
                    f"W odpowiedzi:\n"
                    f"1. Bezpośrednio odpowiedz na zapytanie o sytuację w {powiat_name}.\n"
                    f"2. Wykorzystaj i zacytuj dokładne liczby ze wskaźników powyżej (procenty, pozycja na tle Małopolski, trendy).\n"
                    f"3. Wskaż kluczowe wnioski (np. wyzwania związane z barierami architektonicznymi, potrzebami opiekuńczymi i asystenckimi).\n"
                    f"4. Zaproponuj gotowe rozwiązania z bazy innowacji ROPS.\n"
                    f"Styl: empatyczny, profesjonalny, oparty na twardych danych liczbowych. Pisz wyłącznie po polsku."
                )

                # Wywołujemy preferowany model qwen lub fallback
                model_to_use = "qwen/qwen3.8-27b"
                res = client.chat.completions.create(
                    model=model_to_use,
                    messages=[
                        {"role": "system", "content": "Jesteś ekspertem analitykiem diagnoz społecznych Małopolski."},
                        {"role": "user", "content": prompt}
                    ],
                    max_tokens=350,
                    temperature=0.2
                )
                content = res.choices[0].message.content.strip()
                if content and len(content) > 100:
                    return content
            except Exception as e:
                logger.warning(f"Błąd generowania Groq LLM: {e}. Używam generatora deterministycznego.")

        # Niezawodny generator deterministyczny (wysokiej jakości szablon z danymi)
        primary = reports[0] if reports else None
        p_val = primary['latest_value'] if primary else "–"
        p_unit = primary['unit'] if primary else "%"
        p_avg = primary['region_avg'] if primary else "–"
        p_rank = primary['rank'] if primary else "–"

        deterministic_synthesis = (
            f"### Analiza sytuacji w {powiat_name}\n\n"
            f"Na podstawie diagnoz społecznych **Regionalnego Ośrodka Polityki Społecznej w Krakowie** oraz danych spisowych, "
            f"w obszarze objętym Twoim zapytaniem zidentyfikowano kluczowe wskaźniki dla **{powiat_name}**:\n\n"
            f"{chr(10).join(stats_lines)}\n\n"
            f"#### 🔍 Główne wnioski i interpretacja danych:\n"
            f"1. **Skala potrzeb i barier**: Wskaźnik głównej diagnozy w {powiat_name} wynosi **{p_val} {p_unit}** (przy średniej wojewódzkiej **{p_avg} {p_unit}**), "
            f"co plasuje powiat na **{p_rank}. pozycji w Małopolsce**.\n"
            f"2. **Dostępność przestrzenna**: Osoby o ograniczonej mobilności (w tym poruszające się na wózkach inwalidzkich) "
            f"wymagają szczególnego wsparcia w zakresie likwidacji barier w transporcie lokalnym, instytucjach publicznych oraz budynkach mieszkalnych.\n"
            f"3. **Rekomendowane działania**: Warto wykorzystać sprawdzone innowacje społeczne wypracowane w regionie małopolskim, "
            f"które mogą być bezpośrednio replikowane na terenie Twojej gminy lub powiatu.\n\n"
            f"Poniżej przygotowaliśmy interaktywny wykres szeregu czasowego oraz szczegółowe karty diagnoz społecznych."
        )

        return deterministic_synthesis
