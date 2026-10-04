import json
import logging
import re
import unicodedata
from pathlib import Path
from typing import Dict, Any, List, Optional, Tuple

from config import GROQ_API_KEY, GROQ_MODEL
from supabase_client import DatabaseRepository
from matching.embeddings import compute_embedding, cosine_similarity, compute_lexical_overlap, strip_accents
from matching.service import EXPERTS_DIRECTORY, DEFAULT_EXPERT

logger = logging.getLogger("hubmi.indicators.rag")

# Słownik 22 powiatów Małopolski z odmianami fleksyjnymi i nazwami miast
POWIATY_MAPPING = {
    "krakowski": {
        "id": "krakowski",
        "name": "powiat krakowski",
        "display_name": "Powiat Krakowski",
        "is_city": False,
        "keywords": ["krakowski", "krakowskim", "krakowskiego", "krakowskie", "powiecie krakowskim", "powiatu krakowskiego", "ziemski krakowski"]
    },
    "krakow": {
        "id": "krakow",
        "name": "powiat m. Kraków",
        "display_name": "Kraków (miasto)",
        "is_city": True,
        "keywords": ["krakow", "kraków", "krakowie", "krakowa", "m. kraków", "miasto kraków", "m. krakow", "w krakowie"]
    },
    "bochenski": {
        "id": "bochenski",
        "name": "powiat bocheński",
        "display_name": "Powiat Bocheński",
        "is_city": False,
        "keywords": ["bocheński", "bochenski", "bochnia", "bochni", "bocheńskim", "bochenskim", "bocheńskiego"]
    },
    "brzeski": {
        "id": "brzeski",
        "name": "powiat brzeski",
        "display_name": "Powiat Brzeski",
        "is_city": False,
        "keywords": ["brzeski", "brzesku", "brzeskim", "brzeskiego", "brzesko", "brzeskiem"]
    },
    "chrzanowski": {
        "id": "chrzanowski",
        "name": "powiat chrzanowski",
        "display_name": "Powiat Chrzanowski",
        "is_city": False,
        "keywords": ["chrzanowski", "chrzanowie", "chrzanowskim", "chrzanów", "chrzanow", "chrzanowskiego"]
    },
    "dabrowski": {
        "id": "dabrowski",
        "name": "powiat dąbrowski",
        "display_name": "Powiat Dąbrowski",
        "is_city": False,
        "keywords": ["dąbrowski", "dabrowski", "dąbrowie", "dabrowskim", "dąbrowa tarnowska", "dabrowska", "powiśle dąbrowskie"]
    },
    "gorlicki": {
        "id": "gorlicki",
        "name": "powiat gorlicki",
        "display_name": "Powiat Gorlicki",
        "is_city": False,
        "keywords": ["gorlicki", "gorlicach", "gorlickim", "gorlice", "gorlickiego"]
    },
    "limanowski": {
        "id": "limanowski",
        "name": "powiat limanowski",
        "display_name": "Powiat Limanowski",
        "is_city": False,
        "keywords": ["limanowski", "limanowej", "limanowskim", "limanowa", "limanowskiego"]
    },
    "nowy-sacz": {
        "id": "nowy-sacz",
        "name": "powiat m. Nowy Sącz",
        "display_name": "Nowy Sącz (miasto)",
        "is_city": True,
        "keywords": ["nowy sącz", "nowym sączu", "nowego sącza", "nowy sacz", "m. nowy sącz", "miasto nowy sącz"]
    },
    "nowosadecki": {
        "id": "nowosadecki",
        "name": "powiat nowosądecki",
        "display_name": "Powiat Nowosądecki",
        "is_city": False,
        "keywords": ["nowosądecki", "nowosadecki", "nowosądeckim", "nowosadeckim", "ziemski nowosądecki", "nowosądeckiego"]
    },
    "nowotarski": {
        "id": "nowotarski",
        "name": "powiat nowotarski",
        "display_name": "Powiat Nowotarski",
        "is_city": False,
        "keywords": ["nowotarski", "nowym targu", "nowotarskim", "nowy targ", "nowotarskiego"]
    },
    "miechowski": {
        "id": "miechowski",
        "name": "powiat miechowski",
        "display_name": "Powiat Miechowski",
        "is_city": False,
        "keywords": ["miechowski", "miechowie", "miechowskim", "miechów", "miechow", "miechowskiego"]
    },
    "myslenicki": {
        "id": "myslenicki",
        "name": "powiat myślenicki",
        "display_name": "Powiat Myślenicki",
        "is_city": False,
        "keywords": ["myślenicki", "myslenicki", "myślenicach", "myslenicach", "myślenickim", "myślenice", "myslenice", "myślenickiego"]
    },
    "olkuski": {
        "id": "olkuski",
        "name": "powiat olkuski",
        "display_name": "Powiat Olkuski",
        "is_city": False,
        "keywords": ["olkuski", "olkuszu", "olkuskim", "olkusz", "olkuskiego"]
    },
    "oswiecimski": {
        "id": "oswiecimski",
        "name": "powiat oświęcimski",
        "display_name": "Powiat Oświęcimski",
        "is_city": False,
        "keywords": ["oświęcimski", "oswiecimski", "oświęcimiu", "oswiecimiu", "oświęcimskim", "oświęcim", "oswiecim", "oświęcimskiego"]
    },
    "proszowicki": {
        "id": "proszowicki",
        "name": "powiat proszowicki",
        "display_name": "Powiat Proszowicki",
        "is_city": False,
        "keywords": ["proszowicki", "proszowicach", "proszowickim", "proszowice", "proszowickiego"]
    },
    "suski": {
        "id": "suski",
        "name": "powiat suski",
        "display_name": "Powiat Suski",
        "is_city": False,
        "keywords": ["suski", "suskim", "sucha beskidzka", "suchej beskidzkiej", "suskiego"]
    },
    "tarnow": {
        "id": "tarnow",
        "name": "powiat m. Tarnów",
        "display_name": "Tarnów (miasto)",
        "is_city": True,
        "keywords": ["tarnów", "tarnowie", "tarnowa", "tarnow", "m. tarnów", "miasto tarnów", "w tarnowie"]
    },
    "tarnowski": {
        "id": "tarnowski",
        "name": "powiat tarnowski",
        "display_name": "Powiat Tarnowski",
        "is_city": False,
        "keywords": ["tarnowski", "tarnowskim", "tarnowskiego", "ziemski tarnowski"]
    },
    "tatrzanski": {
        "id": "tatrzanski",
        "name": "powiat tatrzański",
        "display_name": "Powiat Tatrzański",
        "is_city": False,
        "keywords": ["tatrzański", "tatrzanski", "zakopane", "zakopanem", "tatrzańskim", "tatrzanskim", "podhale", "tatrzańskiego"]
    },
    "wadowicki": {
        "id": "wadowicki",
        "name": "powiat wadowicki",
        "display_name": "Powiat Wadowicki",
        "is_city": False,
        "keywords": ["wadowicki", "wadowicach", "wadowickim", "wadowice", "wadowickiego"]
    },
    "wielicki": {
        "id": "wielicki",
        "name": "powiat wielicki",
        "display_name": "Powiat Wielicki",
        "is_city": False,
        "keywords": ["wielicki", "wieliczce", "wielickim", "wieliczka", "wielickiego"]
    }
}


def strip_accents_flexible(text: str) -> str:
    """Usuwa znaki diakrytyczne dla elastycznego porównywania tekstu."""
    text = text.replace("ł", "l").replace("Ł", "L")
    return "".join(c for c in unicodedata.normalize("NFD", text) if unicodedata.category(c) != "Mn").lower()


def detect_powiat_from_query_or_pref(query: str, preferred_powiat_id: Optional[str] = None) -> Tuple[Dict[str, Any], str]:
    """
    KROK 1: Wykrycie powiatu.
    NAJPIERW sprawdza czy użytkownik podał powiat w treści zapytania (np. 'w Nowym Sączu', 'tarnowskim').
    DOPIERO gdy w treści nie ma powiatu, stosuje preferred_powiat_id z dropdownu.
    """
    q_clean = strip_accents_flexible(query)

    # 1. Sprawdź najdłuższe i najbardziej specyficzne frazy najpierw (np. 'powiat krakowski' przed 'krakow')
    if any(k in q_clean for k in ["powiat krakow", "powiecie krakow", "powiatu krakow", "ziemski krakow"]):
        return POWIATY_MAPPING["krakowski"], "detected_in_query"

    if any(k in q_clean for k in ["nowy sacz", "nowym saczu", "nowego sacza"]):
        if any(k in q_clean for k in ["powiat nowosad", "ziemski nowosad"]):
            return POWIATY_MAPPING["nowosadecki"], "detected_in_query"
        return POWIATY_MAPPING["nowy-sacz"], "detected_in_query"

    if any(k in q_clean for k in ["powiat tarnow", "powiecie tarnow", "ziemski tarnow"]):
        return POWIATY_MAPPING["tarnowski"], "detected_in_query"

    # Sprawdzenie wszystkich powiatów w treści zapytania
    for p_id, p_info in POWIATY_MAPPING.items():
        for kw in p_info["keywords"]:
            kw_clean = strip_accents_flexible(kw)
            pattern = r"(?:\b|_)" + re.escape(kw_clean) + r"(?:\b|_)"
            if re.search(pattern, q_clean):
                return p_info, "detected_in_query"

    # 2. Jeśli w zapytaniu nie podano żadnego powiatu, użyj wybranego z selektora UI
    if preferred_powiat_id and preferred_powiat_id in POWIATY_MAPPING:
        return POWIATY_MAPPING[preferred_powiat_id], "explicit_dropdown"

    # 3. Domyślny fallback: Powiat Krakowski
    return POWIATY_MAPPING["krakowski"], "default"


def load_indicators_data() -> Dict[str, Any]:
    """Wczytuje zaktualizowany plik visualize_data.json ze wskaźnikami ROPS."""
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


# Cache wektorów dla wskaźników (żeby nie liczyć ich przy każdym zapytaniu)
_INDICATORS_EMBEDDING_CACHE: Dict[str, List[float]] = {}


def get_indicator_embedding(ind_id: str, ind_info: Dict[str, Any]) -> List[float]:
    global _INDICATORS_EMBEDDING_CACHE
    if ind_id in _INDICATORS_EMBEDDING_CACHE:
        return _INDICATORS_EMBEDDING_CACHE[ind_id]

    doc_text = f"{ind_info.get('name', '')}. Opis: {ind_info.get('description', '')}. Jednostka: {ind_info.get('unit', '')}"
    vec = compute_embedding(doc_text)
    _INDICATORS_EMBEDDING_CACHE[ind_id] = vec
SUGGESTED_RAG_QUERIES = [
    "Dostępność i osoby na wózkach w powiecie krakowskim",
    "Bezrobocie i poszukiwanie pracy w powiecie tarnowskim",
    "Sytuacja seniorów i domy opieki w Nowym Sączu",
    "Piecza zastępcza i rodziny w powiecie wadowickim",
    "Mieszkańcy na pracownika socjalnego w Małopolsce",
    "Czas pobytu w szpitalu i ochrona zdrowia w powiecie oświęcimskim"
]

SOCIAL_DOMAIN_STEMS = {
    # Niepełnosprawność i dostępność
    "niepelnosprawn", "wozk", "inwalid", "ruchow", "barier", "dostepn", "rehabilitac",
    "migow", "niedowidz", "niewidom", "autyzm", "asystent",
    # Rynek pracy i bezrobocie
    "prac", "bezroboc", "zatrudn", "zarob", "ubostw", "staz", "zwolnien", "biern",
    # Pomoc społeczna
    "zasil", "pomoc spoleczn", "pracownik socjaln", "ops", "mops", "gops", "pcpr",
    "schronisk", "bezdomn", "wykluczen", "swiadczen",
    # Seniorzy
    "senior", "starsz", "emeryt", "starosc", "dps", "dom opiek", "wytchnieniow", "alzheimer", "opiekun",
    # Rodzina, dzieci, piecza zastępcza
    "dziec", "rodzin", "zastepcz", "piecz", "sierot", "wychowawcz", "mlodziez", "rodzic",
    "zlob", "przedszkol", "wielodzietn", "adopcj", "dom dzieck",
    # Zdrowie
    "szpital", "zdrow", "rak", "nowotwor", "medycyn", "lecz", "chorob", "pacjent", "aptek",
    "przychodn", "lekarz", "psychiat", "psycholog",
    # Mieszkalnictwo, demografia, budżety gmin, kultura
    "mieszkanc", "ludnosc", "demograf", "urodzen", "zgon", "budzet", "wydatk", "gmin", "powiat",
    "muze", "kultur", "bibliotek", "komunikacj", "transport",
    # Innowacje i projekty
    "innowac", "grant", "rops", "projekt", "ngo", "fundacj", "stowarzyszen", "spoldzieln", "ekonom",
    # Powiaty i miasta Małopolski
    "malopolsk", "krakow", "tarnow", "nowy sacz", "bochni", "brzesk", "chrzanow",
    "dabrow", "gorlic", "limanow", "miechow", "myslenic", "olkusz", "oswiecim",
    "proszowic", "susk", "sucha", "tatrzan", "zakopan", "podhal", "wadowic", "wielicz"
}

OFF_TOPIC_PATTERNS = [
    # Kulinaria
    r"\b(?:przepis(?:y|em|u)?|ugotuj|upiecz|ciast(?:o|a|em)|pizz(?:a|y|e)|nalesnik|zup(?:a|y|e)|obiad|patelni|smazen|gotowan|restauracj|jadaln|schabow|drozdze|maka|cukier)\b",
    # Gry i sport
    r"\b(?:gra(?:c|my|lem|z)?|minecraft|fortnite|playstation|xbox|fifa|csgo|mecz|pilk(?:a|i)|ekstraklas|liga mistrzow|bramk(?:a|i)|gol(?:a|e)?|turniej|sportow|tenis|koszykowk)\b",
    # IT, programowanie, hacking
    r"\b(?:napisz (?:kod|skrypt|program|funkcj)|python(?:ie)?|javascript|typescript|c\+\+|html|css|sql injection|zlam haslo|hack(?:owac|er)?|wirus|trojan)\b",
    # Poezja, żarty, bajki
    r"\b(?:napisz (?:wiersz|piosenk|rap|rymowank)|opowiedz (?:kawal|zart|dowcip|bajk)|streszczenie lektur)\b",
    # Encyklopedia ogólna
    r"\b(?:stolica (?:francji|niemiec|wloch|hiszpanii|usa|chin|japoni)|ile to jest \d|kto byl (?:napoleon|cezarem|prezydentem)|odleglosc do (?:ksiezyc|mars)|uklad sloneczn)\b",
    # Handel i zakupy
    r"\b(?:kupie|sprzedam|cena (?:iphone|samochodu|opon)|ogloszeni|allegro|olx|promocj(?:a|e) w biedronce)\b",
    # Pogoda i horoskopy
    r"\b(?:jaka pogoda|prognoza pogody|bedzie padac|temperatura jutro|horoskop|znaki zodiaku|astrologi)\b",
    # Prompt injection / jailbreak
    r"(?:ignore (?:all )?previous instructions|zapomnij poprzednie instrukcje|jestes teraz|dan mode|bypass guardrail)"
]


def evaluate_rag_guardrail(query: str, max_indicator_similarity: float = 0.0) -> Tuple[str, Optional[str]]:
    """
    GUARDRAIL DLA KNOWLEDGE RAG:
    Weryfikuje czy zapytanie użytkownika jest sensowne i mieści się w domenie Obserwatorium Społecznego ROPS.
    Zwraca (status, message), gdzie status to:
    - 'PASSED' (pytanie sensowne, dopuszczone do analizy)
    - 'BLOCKED_GIBBERISH' (losowe znaki, brak sensu, za krótkie)
    - 'BLOCKED_OFF_TOPIC' (tematyka poza polityką społeczną Małopolski)
    """
    raw = query.strip()
    q_clean = strip_accents_flexible(raw)

    # 1. Sprawdzenie długości i obecności liter
    if len(raw) < 3:
        return (
            "BLOCKED_GIBBERISH",
            "Wpisane zapytanie jest zbyt krótkie. Wpisz zagadnienie dotyczące wyzwań społecznych lub mieszkańców Małopolski (np. 'osoby na wózkach w powiecie krakowskim')."
        )

    if not re.search(r"[a-zA-ZąćęłńóśźżĄĆĘŁŃÓŚŹŻ]", raw):
        return (
            "BLOCKED_GIBBERISH",
            "Zapytanie nie zawiera słów ani zrozumiałej treści tekstowej. Wpisz konkretne pytanie społeczne lub wskaźnik dla Małopolski."
        )

    # 2. Ciągi losowych znaków (keyboard mashing / spam)
    if re.search(r"(.)\1{3,}", q_clean):
        return (
            "BLOCKED_GIBBERISH",
            "Wykryto powtarzające się znaki. Prosimy o sformułowanie pytania w języku naturalnym."
        )

    if re.search(r"\b(?:asdf|qwerty|zxcvb|12345|hjkl)\b", q_clean):
        return (
            "BLOCKED_GIBBERISH",
            "Wpisane zapytanie wygląda na losowy ciąg znaków klawiatury. Zadaj konkretne pytanie dotyczące polityki społecznej i wyzwań mieszkańców."
        )

    words = re.findall(r"[a-z0-9]+", q_clean)
    vowels = set("aeiouy")
    for w in words:
        if len(w) >= 6 and not any(c in vowels for c in w):
            return (
                "BLOCKED_GIBBERISH",
                "Wpisane słowa nie przypominają naturalnego języka. Sformułuj zapytanie opisujące problem lub wskaźnik społeczny."
            )

    # 3. Ewidentny off-topic (kulinaria, sport, IT, gry, ogólne ciekawostki, jailbreak)
    for pat in OFF_TOPIC_PATTERNS:
        if re.search(pat, q_clean):
            return (
                "BLOCKED_OFF_TOPIC",
                "Baza wiedzy i raporty ROPS Kraków służą do analizy danych społecznych, wskaźników regionalnych oraz innowacji w Małopolsce. Twoje zapytanie dotyczy tematu spoza tego zakresu (np. kulinaria, sport, gry lub ogólna rozrywka). Możesz zapytać o bezrobocie, sytuację seniorów, dostępność architektoniczną czy ochronę zdrowia."
            )

    # 4. Sprawdzenie słów kluczowych domeny polityki społecznej i regionu
    has_domain_keyword = any(stem in q_clean for stem in SOCIAL_DOMAIN_STEMS)

    # Jeśli nie ma ani słowa kluczowego, ani semantycznego dopasowania do żadnego wskaźnika
    if not has_domain_keyword and max_indicator_similarity < 0.28:
        return (
            "BLOCKED_OFF_TOPIC",
            "Nie znaleziono powiązania z tematyką polityki społecznej ani wskaźnikami Małopolski. Baza wiedzy ROPS koncentruje się na zagadnieniach takich jak: rynek pracy, niepełnosprawność, starzejące się społeczeństwo, opieka wytchnieniowa, rodzicielstwo zastępcze oraz usługi opiekuńcze."
        )

    return ("PASSED", None)


class KnowledgeRagService:
    @classmethod
    def execute_rag(cls, query: str, preferred_powiat_id: Optional[str] = None) -> Dict[str, Any]:
        """
        DYNAMICZNY SILNIK RAG:
        1. Rozpoznaje powiat (NAJPIERW z treści zapytania, a dopiero potem z preferencji).
        2. Wektoryzuje zapytanie użytkownika (SentenceTransformer).
        3. Oblicza semantyczne i leksykalne podobieństwo zapytania do KAŻDEGO z 17 wskaźników ROPS.
        4. Pobiera dane historyczne i pozycję wykrytego powiatu dla NAJLEPIEJ pasujących wskaźników.
        5. Wyszukuje semantycznie dopasowane innowacje ze 115 projektów ROPS.
        6. Dobiera dedykowanego eksperta merytorycznego ROPS.
        7. Generuje syntezę analityczną przez LLM Groq (lub inteligentny generator deterministyczny).
        """
        all_data = load_indicators_data()

        # GUARDRAIL KROK 1: Wczesna weryfikacja bełkotu i ewidentnego off-topic
        early_status, early_msg = evaluate_rag_guardrail(query, max_indicator_similarity=0.0)
        if early_status in ["BLOCKED_GIBBERISH", "BLOCKED_OFF_TOPIC"]:
            detected_powiat_info, _ = detect_powiat_from_query_or_pref(query, preferred_powiat_id)
            return {
                "success": False,
                "guardrail_status": early_status,
                "guardrail_message": early_msg,
                "query": query,
                "detected_powiat": {
                    "id": detected_powiat_info["id"],
                    "name": detected_powiat_info["name"],
                    "display_name": detected_powiat_info["display_name"],
                    "is_city": detected_powiat_info.get("is_city", False)
                },
                "detected_topics": [],
                "ai_synthesis": early_msg,
                "primary_report": None,
                "matched_reports": [],
                "chart_data": {
                    "report_id": "",
                    "report_title": "",
                    "unit": "",
                    "latest_year": "",
                    "trend_series": [],
                    "comparison_bars": []
                },
                "matched_innovations": [],
                "matched_expert": None,
                "suggested_queries": SUGGESTED_RAG_QUERIES
            }

        # 1. Wykrycie powiatu (Query FIRST, dropdown second)
        detected_powiat_info, match_source = detect_powiat_from_query_or_pref(query, preferred_powiat_id)
        powiat_raw_name = detected_powiat_info["name"]
        powiat_display_name = detected_powiat_info["display_name"]
        powiat_id = detected_powiat_info["id"]

        # 2. Generowanie wektora zapytania
        query_vector = compute_embedding(query)

        # 3. SEMANTYCZNE DOPASOWANIE WSKAŹNIKÓW (zamiast sztywnych reguł)
        scored_indicators = []
        for ind_id, ind_info in all_data.items():
            ind_vec = get_indicator_embedding(ind_id, ind_info)
            vec_sim = cosine_similarity(query_vector, ind_vec)

            doc_text = f"{ind_info.get('name', '')} {ind_info.get('description', '')}"
            lex_score, _ = compute_lexical_overlap(query, doc_text)

            # Specjalne wzmocnienia domenowe dla charakterystycznych pojęć
            q_clean = strip_accents_flexible(query)
            boost = 0.0

            # Niepełnosprawność i wózki
            if any(w in q_clean for w in ["wozk", "niepelnosprawn", "inwalid", "ruchow", "barier", "dostepn"]):
                if ind_id in ["severe_disability_share", "disability_support_share", "total_disability_share"]:
                    boost += 0.35
            # Bezrobocie i praca
            if any(w in q_clean for w in ["prac", "bezroboc", "zatrudn", "zarob", "ubostw", "staz"]):
                if ind_id in ["unemployed_longer_than_1_year", "working_age_population", "cash_social_assistance_benefits"]:
                    boost += 0.35
            # Seniorzy
            if any(w in q_clean for w in ["senior", "starsz", "emeryt", "starosc"]):
                if ind_id in ["disability_support_share", "average_hospital_stay", "residents_per_social_worker"]:
                    boost += 0.35
            # Zdrowie i szpitale
            if any(w in q_clean for w in ["szpital", "zdrow", "rak", "nowotwor", "medycyn", "lecz"]):
                if ind_id in ["average_hospital_stay", "cancer_incidence", "pharmacy_availability"]:
                    boost += 0.35
            # Dzieci i rodziny
            if any(w in q_clean for w in ["rodzin", "dziec", "zastepc", "piecz", "wychowaw", "przedszkol"]):
                if ind_id in ["foster_families_count", "care_and_education_centers", "kindergarten_availability", "large_families_share"]:
                    boost += 0.35
            # Kultura
            if any(w in q_clean for w in ["muze", "kultur"]):
                if ind_id in ["museum_availability", "urbanization_rate"]:
                    boost += 0.35

            final_score = (0.5 * vec_sim + 0.5 * lex_score) + boost
            scored_indicators.append((final_score, ind_id, ind_info))

        # Sortuj wskaźniki po najwyższym dopasowaniu
        scored_indicators.sort(key=lambda x: x[0], reverse=True)
        top_matched_indicators = scored_indicators[:4]

        # GUARDRAIL KROK 2: Semantyczna weryfikacja dopasowania wskaźników
        max_ind_sim = scored_indicators[0][0] if scored_indicators else 0.0
        late_status, late_msg = evaluate_rag_guardrail(query, max_indicator_similarity=max_ind_sim)
        if late_status != "PASSED":
            return {
                "success": False,
                "guardrail_status": late_status,
                "guardrail_message": late_msg,
                "query": query,
                "detected_powiat": {
                    "id": powiat_id,
                    "name": powiat_raw_name,
                    "display_name": powiat_display_name,
                    "is_city": detected_powiat_info.get("is_city", False)
                },
                "detected_topics": [],
                "ai_synthesis": late_msg,
                "primary_report": None,
                "matched_reports": [],
                "chart_data": {
                    "report_id": "",
                    "report_title": "",
                    "unit": "",
                    "latest_year": "",
                    "trend_series": [],
                    "comparison_bars": []
                },
                "matched_innovations": [],
                "matched_expert": None,
                "suggested_queries": SUGGESTED_RAG_QUERIES
            }

        # 4. Zgromadzenie danych statystycznych dla wybranych wskaźników
        reports_summary: List[Dict[str, Any]] = []
        for score, ind_id, ind_info in top_matched_indicators:
            years = ind_info.get("years", [])
            unit = ind_info.get("unit", "")
            dane_powiaty = ind_info.get("dane_powiaty", {})
            powiat_series = dane_powiaty.get(powiat_raw_name, {})

            latest_year = years[-1] if years else ""
            first_year = years[0] if years else ""
            latest_powiat_val = powiat_series.get(latest_year, 0.0) if latest_year else 0.0
            first_powiat_val = powiat_series.get(first_year, 0.0) if first_year else 0.0

            delta = round(latest_powiat_val - first_powiat_val, 2) if len(years) > 1 else 0.0

            all_vals_latest = [
                p_dict.get(latest_year, 0.0)
                for p_dict in dane_powiaty.values()
                if p_dict.get(latest_year) is not None
            ]
            region_avg_latest = round(sum(all_vals_latest) / len(all_vals_latest), 2) if all_vals_latest else 0.0

            ranked = sorted(
                [(p_name, p_dict.get(latest_year, 0.0)) for p_name, p_dict in dane_powiaty.items()],
                key=lambda x: x[1],
                reverse=True
            )
            rank = next((idx + 1 for idx, (p_name, _) in enumerate(ranked) if p_name == powiat_raw_name), 1)

            time_series = []
            for y in years:
                val = powiat_series.get(y)
                if val is not None:
                    time_series.append({"year": y, "value": val})

            reports_summary.append({
                "id": ind_id,
                "title": ind_info.get("name", ind_id),
                "category": cls._derive_category_for_indicator(ind_id),
                "unit": unit,
                "description": ind_info.get("description", ""),
                "latest_year": latest_year,
                "latest_value": latest_powiat_val,
                "first_value": first_powiat_val,
                "delta": delta,
                "region_avg": region_avg_latest,
                "rank": rank,
                "total_powiats": len(dane_powiaty) or 22,
                "reason": f"Dopasowanie semantyczne do zapytania ({round(score * 100, 1)}%)",
                "time_series": time_series
            })

        # Wybór wskaźnika głównego (preferowany wieloletni szereg czasowy)
        primary_report = None
        for r in reports_summary:
            if len(r["time_series"]) > 1:
                primary_report = r
                break
        if not primary_report and reports_summary:
            primary_report = reports_summary[0]

        # 5. Przygotowanie serii czasowych i wykresów
        chart_data: Dict[str, Any] = {}
        if primary_report:
            p_ind = all_data.get(primary_report["id"], {})
            years = p_ind.get("years", [])
            dane_p = p_ind.get("dane_powiaty", {})
            pow_series = dane_p.get(powiat_raw_name, {})

            trend_chart = []
            for y in years:
                vals_y = [d.get(y) for d in dane_p.values() if d.get(y) is not None]
                avg_y = round(sum(vals_y) / len(vals_y), 2) if vals_y else 0.0
                p_val = pow_series.get(y)
                trend_chart.append({
                    "year": y,
                    "powiatValue": p_val,
                    "regionAvg": avg_y
                })

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
                "comparison_bars": all_ranked_latest[:8]
            }

        # 6. SEMANTYCZNE WYSZUKIWANIE INNOWACJI SPOŁECZNYCH ZE 115 PROJEKTÓW
        all_innovations = DatabaseRepository.get_all_innovations()
        matched_innovations = cls._match_innovations_semantically(query_vector, query, all_innovations)

        # 7. DOBÓR DEDYKOWANEGO EKSPERTA MERYTORYCZNEGO ROPS
        matched_expert = cls._pick_domain_expert(query)

        # 8. GENEROWANIE SYNTEZY AI (Groq lub inteligentny fallback)
        ai_synthesis = cls._generate_ai_synthesis(
            query=query,
            powiat_name=powiat_display_name,
            reports=reports_summary,
            innovations=matched_innovations,
            expert=matched_expert
        )

        detected_topics = list({r["category"] for r in reports_summary})

        return {
            "success": True,
            "guardrail_status": "PASSED",
            "guardrail_message": None,
            "query": query,
            "detected_powiat": {
                "id": powiat_id,
                "name": powiat_raw_name,
                "display_name": powiat_display_name,
                "is_city": detected_powiat_info.get("is_city", False)
            },
            "detected_topics": detected_topics[:3],
            "ai_synthesis": ai_synthesis,
            "primary_report": primary_report,
            "matched_reports": reports_summary,
            "chart_data": chart_data,
            "matched_innovations": matched_innovations,
            "matched_expert": matched_expert,
            "suggested_queries": SUGGESTED_RAG_QUERIES
        }

    @staticmethod
    def _derive_category_for_indicator(ind_id: str) -> str:
        cat_map = {
            "severe_disability_share": "Niepełnosprawność",
            "disability_support_share": "Niepełnosprawność",
            "total_disability_share": "Niepełnosprawność",
            "unemployed_longer_than_1_year": "Rynek Pracy",
            "working_age_population": "Demografia",
            "cash_social_assistance_benefits": "Pomoc Społeczna",
            "residents_per_social_worker": "Pomoc Społeczna",
            "average_hospital_stay": "Zdrowie",
            "cancer_incidence": "Zdrowie",
            "pharmacy_availability": "Zdrowie",
            "foster_families_count": "Piecza Zastępcza",
            "care_and_education_centers": "Piecza Zastępcza",
            "kindergarten_availability": "Edukacja",
            "large_families_share": "Rodzina",
            "municipal_budget_expenditures": "Finanse",
            "museum_availability": "Kultura",
            "urbanization_rate": "Demografia"
        }
        return cat_map.get(ind_id, "Polityka Społeczna")

    @classmethod
    def _match_innovations_semantically(
        cls,
        query_vector: List[float],
        query_text: str,
        innovations: List[Dict[str, Any]]
    ) -> List[Dict[str, Any]]:
        """Przeszukuje semantycznie bazę 115 innowacji ROPS za pomocą embeddingów i pokrycia leksykalnego."""
        scored = []
        for inn in innovations:
            emb = inn.get("embedding")
            if isinstance(emb, str):
                try:
                    emb = json.loads(emb)
                except Exception:
                    emb = None
            if not emb:
                text_to_embed = f"{inn.get('title', '')}. Problem: {inn.get('addressed_problems', '')}. Opis: {inn.get('description', '')}"
                emb = compute_embedding(text_to_embed)

            vec_sim = cosine_similarity(query_vector, emb)
            doc_text = f"{inn.get('title', '')} {inn.get('addressed_problems', '')} {inn.get('description', '')} {inn.get('target_group', '')}"
            lex_score, _ = compute_lexical_overlap(query_text, doc_text)

            final_sim = 0.5 * vec_sim + 0.5 * lex_score if lex_score > 0 else vec_sim * 0.7

            raw_url = inn.get("url")
            clean_url = raw_url if (raw_url and raw_url.startswith("http")) else None

            raw_video_url = inn.get("video_url")
            clean_video_url = raw_video_url if (raw_video_url and raw_video_url.startswith("http")) else None

            scored.append({
                "id": str(inn.get("id")),
                "title": inn.get("title", ""),
                "description": inn.get("description", ""),
                "addressed_problems": inn.get("addressed_problems", ""),
                "funding_info": inn.get("funding_info"),
                "url": clean_url,
                "video_url": clean_video_url,
                "score": round(final_sim * 100, 1)
            })

        scored.sort(key=lambda x: x["score"], reverse=True)
        return scored[:4]

    @classmethod
    def _pick_domain_expert(cls, query: str) -> Dict[str, Any]:
        """Dobiera eksperta ROPS odpowiadającego tematyce zapytania."""
        q_clean = strip_accents_flexible(query)
        best_exp = DEFAULT_EXPERT
        best_matches = 0
        # Specjalne reguły dla kluczowych domen tematycznych
        if any(w in q_clean for w in ["wozk", "niepelnosprawn", "ruchow", "inwalid", "barier", "dostepn"]):
            for exp in EXPERTS_DIRECTORY:
                if "Zieliński" in exp.get("name", ""):
                    best_exp = exp
                    best_matches = 99
                    break

        if best_matches < 99:
            for exp in EXPERTS_DIRECTORY:
                matches = sum(1 for kw in exp["keywords"] if strip_accents_flexible(kw) in q_clean)
                if matches > best_matches:
                    best_matches = matches
                    best_exp = exp

        topic_clean = re.sub(r"[^a-zA-Z0-9\s]", "", query)[:40].replace(" ", "-")
        return {
            "name": best_exp["name"],
            "title": best_exp["title"],
            "department": best_exp["department"],
            "specialization": best_exp["specialization"],
            "chat_url": f"/chat?topic=Konsultacja-{topic_clean}"
        }

    @classmethod
    def _generate_ai_synthesis(
        cls,
        query: str,
        powiat_name: str,
        reports: List[Dict[str, Any]],
        innovations: List[Dict[str, Any]],
        expert: Dict[str, Any]
    ) -> str:
        """Generuje syntezę RAG w języku polskim z odwołaniem do liczb i innowacji."""
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

        # Próba wywołania Groq z modelem qwen
        if GROQ_API_KEY:
            try:
                from groq import Groq
                client = Groq(api_key=GROQ_API_KEY, timeout=5.0, max_retries=0)

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
                    f"1. Bezpośrednio odnieś się do tematu zapytania w {powiat_name}.\n"
                    f"2. Zacytuj dokładne liczby ze wskaźników powyżej (procenty, pozycję w regionie).\n"
                    f"3. Przedstaw praktyczne wnioski i wyzwania w tym obszarze.\n"
                    f"4. Zaproponuj wskazane innowacje społeczne ROPS jako gotowe rozwiązania.\n"
                    f"Styl: profesjonalny, oparty na twardych danych. Pisz wyłącznie po polsku."
                )

                res = client.chat.completions.create(
                    model="qwen/qwen3.8-27b",
                    messages=[
                        {"role": "system", "content": "Jesteś analitykiem polityki społecznej Małopolski."},
                        {"role": "user", "content": prompt}
                    ],
                    max_tokens=350,
                    temperature=0.2
                )
                content = res.choices[0].message.content.strip()
                if content and len(content) > 100:
                    return content
            except Exception as e:
                logger.warning(f"Groq LLM call: {e}. Używam deterministycznego generatora.")

        # Deterministyczny generator syntezy na podstawie pobranych danych
        primary = reports[0] if reports else None
        p_val = primary['latest_value'] if primary else "–"
        p_unit = primary['unit'] if primary else "%"
        p_avg = primary['region_avg'] if primary else "–"
        p_rank = primary['rank'] if primary else "–"

        deterministic_synthesis = (
            f"### Analiza sytuacji w: {powiat_name}\n\n"
            f"Na podstawie badań **Regionalnego Ośrodka Polityki Społecznej w Krakowie** oraz danych spisowych, "
            f"dla zapytania *„{query}”* w obszarze **{powiat_name}** zidentyfikowano kluczowe wskaźniki:\n\n"
            f"{chr(10).join(stats_lines)}\n\n"
            f"#### 🔍 Kluczowe wnioski:\n"
            f"1. **Skala wyzwania**: Wskaźnik wiodący (*{primary['title'] if primary else 'Diagnoza'}*) w **{powiat_name}** "
            f"wynosi **{p_val} {p_unit}** przy średniej wojewódzkiej **{p_avg} {p_unit}** "
            f"(co plasuje powiat na **{p_rank}. pozycji** w Małopolsce).\n"
            f"2. **Dopasowane innowacje społeczne**: W panelu innowacji poniżej wytypowano projekty z bazy ROPS Kraków "
            f"odpowiadające na to zagadnienie, gotowe do wdrożenia w lokalnych samorządach i organizacjach pozarządowych.\n"
            f"3. **Wsparcie doradcze**: Możesz skonsultować ten problem bezpośrednio z ekspertem ROPS: **{expert['name']}** ({expert['specialization']})."
        )

        return deterministic_synthesis
