import logging
import uuid
from datetime import datetime, timezone
from typing import Optional, List, Dict, Any, Mapping
from supabase import create_client, Client
from config import SUPABASE_URL, SUPABASE_KEY

logger = logging.getLogger("hubmi.database")
logging.basicConfig(level=logging.INFO)

supabase_client: Optional[Client] = None
is_supabase_connected: bool = False

if SUPABASE_URL and SUPABASE_KEY and not SUPABASE_URL.startswith("https://your-project"):
    try:
        supabase_client = create_client(SUPABASE_URL, SUPABASE_KEY)
        is_supabase_connected = True
        logger.info("Successfully initialized Supabase client.")
    except Exception as e:
        logger.warning(f"Failed to connect to Supabase ({e}). Falling back to local in-memory storage.")
        supabase_client = None
        is_supabase_connected = False
else:
    logger.info("Supabase credentials not configured. Using local in-memory storage fallback. Add SUPABASE_URL and SUPABASE_KEY in .env to connect to your database.")

try:
    from local_db import (
        local_save_feedback, local_get_feedback,
        local_save_comment, local_get_comments,
        local_save_tester_application, local_get_tester_applications,
        local_get_tester_application_by_id, local_update_tester_application,
        local_save_idea_status, local_get_all_idea_statuses
    )
except (ImportError, ModuleNotFoundError):
    import sys
    import os
    _backend_dir = os.path.dirname(os.path.abspath(__file__))
    if _backend_dir not in sys.path:
        sys.path.insert(0, _backend_dir)
    from local_db import (
        local_save_feedback, local_get_feedback,
        local_save_comment, local_get_comments,
        local_save_tester_application, local_get_tester_applications,
        local_get_tester_application_by_id, local_update_tester_application,
        local_save_idea_status, local_get_all_idea_statuses
    )


def _as_dict(item: Any) -> Dict[str, Any]:
    return dict(item) if isinstance(item, (dict, Mapping)) else {}


def _as_dict_list(items: Any) -> List[Dict[str, Any]]:
    if isinstance(items, list):
        return [dict(x) for x in items if isinstance(x, (dict, Mapping))]
    return []


# ==========================================
# In-memory database fallback implementation
# ==========================================
class MemoryDB:
    def __init__(self):
        self.profiles: List[Dict[str, Any]] = []
        self.ideas: List[Dict[str, Any]] = []
        self.reactions: List[Dict[str, Any]] = []
        self.innovations: List[Dict[str, Any]] = []
        self.conversations: List[Dict[str, Any]] = []
        self.messages: List[Dict[str, Any]] = []
        self.reported_problems: List[Dict[str, Any]] = []
        self.feedback: List[Dict[str, Any]] = []
        self.comments: List[Dict[str, Any]] = []
        self.tester_applications: List[Dict[str, Any]] = []
        self._seed_default_data()

    def _seed_default_data(self):
        from config import hash_password
        admin_id = str(uuid.uuid4())
        self.profiles.append({
            "id": admin_id,
            "email": "admin@hubmi.com",
            "password_hash": hash_password("admin123"),
            "full_name": "Główny Administrator",
            "role": "admin",
            "created_at": datetime.now(timezone.utc).isoformat()
        })
        user_id = str(uuid.uuid4())
        self.profiles.append({
            "id": user_id,
            "email": "user@hubmi.com",
            "password_hash": hash_password("user123"),
            "full_name": "Jan Kowalski",
            "role": "user",
            "created_at": datetime.now(timezone.utc).isoformat()
        })
        # Default sample ideas
        sample_idea_id = str(uuid.uuid4())
        self.ideas.append({
            "id": sample_idea_id,
            "title": "Aplikacja do wspólnego sadzenia drzew w mieście",
            "description": "Organizujemy akcję sadzenia 100 drzew w miejskim parku w najbliższą sobotę. Szukamy chętnych do pomocy!",
            "category": "Ekologia",
            "user_id": user_id,
            "author_name": "Jan Kowalski",
            "status": "active",
            "created_at": datetime.now(timezone.utc).isoformat()
        })
        # Idea oczekująca na moderację przez administratora (pending)
        pending_idea_id = str(uuid.uuid4())
        self.ideas.append({
            "id": pending_idea_id,
            "title": "Sąsiedzki Mobilny Bank Narzędzi dla Seniorów",
            "description": "Zgłoszenie pilotażowe: wypożyczalnia narzędzi ogrodowych i domowych prowadzona przez sołectwo dla starszych mieszkańców.",
            "category": "Społeczność & Życie",
            "user_id": user_id,
            "author_name": "Jan Kowalski",
            "status": "pending",
            "created_at": datetime.now(timezone.utc).isoformat()
        })
        self.reactions.append({
            "id": str(uuid.uuid4()),
            "idea_id": sample_idea_id,
            "user_id": admin_id,
            "reaction_type": "like",
            "created_at": datetime.now(timezone.utc).isoformat()
        })

        # Domyślne zgłoszenia testerów oczekujące na akceptację administratora
        self.tester_applications.append({
            "id": "app-tester-1",
            "idea_id": sample_idea_id,
            "idea_title": "Aplikacja do wspólnego sadzenia drzew w mieście",
            "user_id": user_id,
            "user_name": "Katarzyna Wiśniewska",
            "user_email": "kasia.wisniewska@tarnow.pl",
            "status": "pending",
            "motivation": "Mieszkam blisko parku i mogę pomóc seniorom w testach terenowych.",
            "created_at": datetime.now(timezone.utc).isoformat()
        })
        self.tester_applications.append({
            "id": "app-tester-2",
            "idea_id": sample_idea_id,
            "idea_title": "Aplikacja do wspólnego sadzenia drzew w mieście",
            "user_id": admin_id,
            "user_name": "Piotr Kowalczyk",
            "user_email": "piotr.kowalczyk@krakow.pl",
            "status": "pending",
            "motivation": "Jestem koordynatorem wolontariatu w Nowym Sączu.",
            "created_at": datetime.now(timezone.utc).isoformat()
        })

        # Domyślny feedback i komentarze testowe dla demonstracji modułu Testera
        self.feedback.append({
            "id": "fb-sample-1",
            "idea_id": sample_idea_id,
            "user_id": admin_id,
            "author_name": "Barbara Nowak",
            "author_role": "Opiekunka osoby starszej / Tester",
            "overall_rating": 5,
            "usability_rating": 4,
            "accessibility_rating": 5,
            "impact_rating": 5,
            "strengths": "Bardzo prosta rejestracja uczestników, czytelny podział zadań na etapy.",
            "weaknesses": "Przyciski potwierdzenia mogłyby mieć nieco większy kontrast na urządzeniach mobilnych.",
            "suggested_improvements": "Warto dodać opcję przypomnień SMS dla osób, które rzadziej korzystają z poczty e-mail.",
            "comment": "Przetestowałam prototyp z grupą 6 sąsiadów – rozwiązanie ma ogromny potencjał integracyjny w małych miejscowościach.",
            "created_at": datetime.now(timezone.utc).isoformat()
        })
        self.feedback.append({
            "id": "fb-sample-2",
            "idea_id": sample_idea_id,
            "user_id": user_id,
            "author_name": "Piotr Wiśniewski",
            "author_role": "Ekspert ds. Dostępności Społecznej",
            "overall_rating": 4,
            "usability_rating": 5,
            "accessibility_rating": 4,
            "impact_rating": 5,
            "strengths": "Świetna koncepcja budowania zaangażowania lokalnego, intuicyjny proces zgłaszania się.",
            "weaknesses": "Brak bezpośredniego powiadomienia koordynatora o osobach z ograniczeniami ruchowymi.",
            "suggested_improvements": "Dodać pole wyboru: 'potrzebuję asystenta' lub 'dostępne dla wózków'.",
            "comment": "Rekomenduję do dalszego skalowania w subregionie tarnowskim po drobnych korektach.",
            "created_at": datetime.now(timezone.utc).isoformat()
        })
        self.comments.append({
            "id": "cmt-sample-1",
            "idea_id": sample_idea_id,
            "user_id": admin_id,
            "author_name": "Marek Zarządca",
            "content": "Dziękujemy za pierwsze uwagi z testów terenowych! Wprowadzamy większe fonty i kontrast w kolejnej aktualizacji.",
            "created_at": datetime.now(timezone.utc).isoformat()
        })

        # ============================================================
        # Baza innowacji (Innovations) - Domyślne dane dla RAG matching
        # ============================================================
        raw_innovations: List[Dict[str, Any]] = [
            {
                "id": "11111111-aaaa-bbbb-cccc-000000000001",
                "title": "Centrum Dziennego Wsparcia Seniora w Domu Opieki 'Złoty Wiek'",
                "addressed_problems": "Brak wykwalifikowanych opiekunów, izolacja i samotność osób starszych w domach starców i placówkach opiekuńczych oraz wysokie koszty pobytu i rehabilitacji bez wystarczającego dofinansowania.",
                "description": "Zintegrowany model opieki dziennej z terapią zajęciową, rehabilitacją ruchową oraz treningami pamięci dla pensjonariuszy domów starców i seniorów niesamodzielnych.",
                "funding_info": "Dofinansowanie w wysokości do 85% ze środków Europejskiego Funduszu Społecznego Plus (FERS Działanie 04.13) oraz dotacji PFRON dla jednostek samorządu terytorialnego i NGO.",
                "target_group": "Seniorzy 65+, osoby z demencją, pensjonariusze domów pomocy społecznej i domów opieki.",
                "beneficiaries": "Osoby starsze, opiekunowie faktyczni, domy starców.",
                "authors": "Konsorcjum ROPS & Fundacja Aktywny Senior",
                "validation": "Przetestowano w 8 placówkach opiekuńczych z udziałem 240 seniorów.",
                "url": "https://hubmi.org/innowacje/domy-starcow-wsparcie-seniorow-dofinansowanie",
                "video_url": "https://www.youtube.com/watch?v=Pl5bkpxEqgs",
                "file_source": "Innowacja_Domy_Starcow_Dotacje_FERS_2025.pdf"
            },
            {
                "id": "22222222-aaaa-bbbb-cccc-000000000002",
                "title": "TeleOpieka 24/7 i Asystent Medyczny dla Domów Spokojnej Starości",
                "addressed_problems": "Trudności z całodobowym monitorowaniem parametrów życiowych seniorów w domach starców przy deficycie pielęgniarek i brak środków na nowoczesny sprzęt medyczny.",
                "description": "Wdrożenie inteligentnych opasek SOS z pulsoksymetrem, detektorem upadków i lokalizacją GPS, połączonych z centralą dyspozytorską i stacją pielęgniarską w placówce.",
                "funding_info": "100% grant celowy z programu 'Dostępność Plus' oraz regionalnych bonów na innowacje społeczne (do 50 000 zł na placówkę).",
                "target_group": "Pensjonariusze domów opieki, seniorzy samotni o ograniczonej mobilności.",
                "beneficiaries": "Pracownicy domów opieki, seniorzy, lekarze rodzinni.",
                "authors": "Instytut Technologii Wspomagających Medycynę",
                "validation": "Spadek liczby niebezpiecznych powikłań po upadkach o 78% w okresie 12 miesięcy.",
                "url": "https://hubmi.org/innowacje/teleopieka-dla-seniorow-dps",
                "video_url": "https://www.youtube.com/watch?v=k85mRPqvMbE",
                "file_source": "Raport_Teleopieka_DPS_Standardy.pdf"
            },
            {
                "id": "33333333-aaaa-bbbb-cccc-000000000003",
                "title": "Międzypokoleniowy Wolontariat Opiekuńczy w Domach Pomocy Społecznej",
                "addressed_problems": "Poczucie odrzucenia i brak kontaktu z młodszym pokoleniem wśród mieszkańców domów starców, depresja starcza oraz brak rąk do prostej pomocy i spacerów.",
                "description": "System parowania przeszkolonych wolontariuszy (uczniów i studentów) z seniorami w domach opieki do regularnych spotkań, czytania prasy, nauki cyfrowej i wspólnych gier.",
                "funding_info": "Dofinansowanie z Narodowego Instytutu Wolności (PROO oraz NOWEFIO) do kwoty 30 000 zł na roczny program.",
                "target_group": "Seniorzy w placówkach całodobowych, młodzież licealna i studenci.",
                "beneficiaries": "Pensjonariusze domów starców, wolontariusze.",
                "authors": "Stowarzyszenie Łączymy Pokolenia",
                "validation": "Zrealizowano 1500 godzin spotkań w 4 domach opieki.",
                "url": "https://hubmi.org/innowacje/miedzypokoleniowy-wolontariat-dps",
                "video_url": None,
                "file_source": "Podrecznik_Wolontariat_DPS_2024.pdf"
            },
            {
                "id": "44444444-aaaa-bbbb-cccc-000000000004",
                "title": "Eko-Spółdzielnia Energetyczna i Społeczna Mikro-OZE",
                "addressed_problems": "Wysokie koszty energii i ubóstwo energetyczne w budynkach wielorodzinnych oraz zanieczyszczenie powietrza generowane przez stare piece węglowe.",
                "description": "Instalacja paneli fotowoltaicznych i pomp ciepła zarządzanych przez lokalną spółdzielnię mieszkańców z redystrybucją oszczędności na fundusz remontowy.",
                "funding_info": "Dotacja do 70% z Narodowego Funduszu Ochrony Środowiska (NFOŚiGW) oraz programu 'Czyste Powietrze'.",
                "target_group": "Wspólnoty mieszkaniowe, mieszkańcy osiedli podmiejskich.",
                "beneficiaries": "Lokatorzy, środowisko naturalne.",
                "authors": "Fundacja Zielona Energia dla Wszystkich",
                "validation": "Oszczędności rachunków średnio o 42% rocznie w 3 pilotażowych blokach.",
                "url": "https://hubmi.org/innowacje/eko-spoldzielnia-energetyczna",
                "video_url": None,
                "file_source": "Przewodnik_EkoSpoldzielnia_OZE.pdf"
            },
            {
                "id": "55555555-aaaa-bbbb-cccc-000000000005",
                "title": "Edukacyjna Platforma Wsparcia Dzieci z Dysleksją i ADHD w Szkołach Publicznych",
                "addressed_problems": "Brak zindywidualizowanych narzędzi dydaktycznych dla uczniów ze spektrum trudności w uczeniu się oraz przeciążenie nauczycieli w klasach integracyjnych.",
                "description": "Gamifikacyjna aplikacja webowa dostosowująca tempo nauki i czytania z wykorzystaniem syntezatora mowy i interaktywnych ćwiczeń kognitywnych.",
                "funding_info": "Dofinansowanie z MEiN w ramach programu 'Innowacje w Edukacji' do 100 000 zł na szkołę.",
                "target_group": "Uczniowie klas 1-6 szkół podstawowych z orzeczeniami o potrzebie kształcenia specjalnego.",
                "beneficiaries": "Uczniowie, pedagodzy szkolni, rodzice.",
                "authors": "Zespół Psychologów Uniwersytetu Warszawskiego",
                "validation": "Przebadano 400 uczniów – wzrost tempa czytania ze zrozumieniem o 35%.",
                "url": "https://hubmi.org/innowacje/edukacja-dysleksja-adhd",
                "video_url": "https://www.youtube.com/watch?v=HZzYekiW_nY",
                "file_source": "Innowacja_Edukacyjna_Dysleksja_2025.pdf"
            }
        ]

        for item in raw_innovations:
            item["embedding"] = None
            item["created_at"] = datetime.now(timezone.utc).isoformat()
            self.innovations.append(item)

        # ============================================================
        # Domyślny czat: Ekspert ROPS Kraków <-> Użytkownik
        # ============================================================
        sample_conv_id = "c1111111-2222-3333-4444-555555555555"
        now_iso = datetime.now(timezone.utc).isoformat()
        self.conversations.append({
            "id": sample_conv_id,
            "user_id": user_id,
            "user_name": "Jan Kowalski",
            "user_email": "user@hubmi.com",
            "idea_id": sample_idea_id,
            "idea_title": "Aplikacja do wspólnego sadzenia drzew w mieście",
            "topic": "Konsultacja z ekspertem ROPS Kraków ds. dofinansowania",
            "status": "in_progress",
            "assigned_admin_id": admin_id,
            "assigned_admin_name": "Ekspert ROPS Kraków",
            "unread_by_admin": 0,
            "unread_by_user": 0,
            "last_message": "Dzień dobry! Z przyjemnością pomożemy w przygotowaniu wniosku.",
            "last_message_at": now_iso,
            "created_at": now_iso
        })
        self.messages.append({
            "id": str(uuid.uuid4()),
            "conversation_id": sample_conv_id,
            "sender_id": user_id,
            "sender_name": "Jan Kowalski",
            "sender_role": "user",
            "content": "Dzień dobry, chciałbym skonsultować nasz projekt ekologiczny z ekspertem ROPS Kraków pod kątem dotacji.",
            "created_at": now_iso
        })
        self.messages.append({
            "id": str(uuid.uuid4()),
            "conversation_id": sample_conv_id,
            "sender_id": admin_id,
            "sender_name": "Ekspert ROPS Kraków",
            "sender_role": "admin",
            "content": "Dzień dobry! Z przyjemnością pomożemy w przygotowaniu wniosku. W jakim powiecie planują Państwo realizację?",
            "created_at": now_iso
        })

memory_db = MemoryDB()

# ==========================================
# Unified Database Repository Wrapper
# ==========================================
class DatabaseRepository:
    """Provides a consistent async/sync interface whether using real Supabase or local fallback."""

    # --- PROFILES / USERS ---
    @staticmethod
    def get_profile_by_email(email: str) -> Optional[Dict[str, Any]]:
        if is_supabase_connected and supabase_client:
            try:
                res = supabase_client.table("users").select("*").eq("email", email.lower()).execute()
                data = _as_dict_list(res.data)
                if data:
                    return data[0]
                return None
            except Exception as e:
                logger.error(f"Supabase error get_profile_by_email: {e}")
        return next((p for p in memory_db.profiles if p["email"].lower() == email.lower()), None)

    @staticmethod
    def get_profile_by_id(user_id: str) -> Optional[Dict[str, Any]]:
        if is_supabase_connected and supabase_client:
            try:
                res = supabase_client.table("users").select("*").eq("id", user_id).execute()
                data = _as_dict_list(res.data)
                if data:
                    return data[0]
                return None
            except Exception as e:
                logger.error(f"Supabase error get_profile_by_id: {e}")
        return next((p for p in memory_db.profiles if p["id"] == user_id), None)

    @staticmethod
    def create_profile(profile_data: Dict[str, Any]) -> Dict[str, Any]:
        profile_data["id"] = profile_data.get("id") or str(uuid.uuid4())
        profile_data["email"] = profile_data["email"].lower()
        profile_data["created_at"] = profile_data.get("created_at") or datetime.now(timezone.utc).isoformat()
        
        if is_supabase_connected and supabase_client:
            try:
                res = supabase_client.table("users").insert(profile_data).execute()
                data = _as_dict_list(res.data)
                if data:
                    return data[0]
            except Exception as e:
                logger.error(f"Supabase error create_profile: {e}")
        memory_db.profiles.append(profile_data)
        return profile_data

    @staticmethod
    def get_all_profiles() -> List[Dict[str, Any]]:
        if is_supabase_connected and supabase_client:
            try:
                res = supabase_client.table("users").select("id, email, full_name, role, created_at").order("created_at", desc=True).execute()
                data = _as_dict_list(res.data)
                if data:
                    return data
            except Exception as e:
                logger.error(f"Supabase error get_all_profiles: {e}")
        return [
            {
                "id": p["id"],
                "email": p["email"],
                "full_name": p.get("full_name", ""),
                "role": p.get("role", "user"),
                "created_at": p.get("created_at")
            }
            for p in memory_db.profiles
        ]

    @staticmethod
    def update_profile(user_id: str, updates: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        if is_supabase_connected and supabase_client:
            try:
                res = supabase_client.table("users").update(updates).eq("id", user_id).execute()
                data = _as_dict_list(res.data)
                if data:
                    return data[0]
            except Exception as e:
                logger.error(f"Supabase error update_profile: {e}")
        for p in memory_db.profiles:
            if p["id"] == user_id:
                p.update(updates)
                return p
        return None

    @staticmethod
    def delete_profile(user_id: str) -> bool:
        if is_supabase_connected and supabase_client:
            try:
                res = supabase_client.table("users").delete().eq("id", user_id).execute()
                return bool(res.data)
            except Exception as e:
                logger.error(f"Supabase error delete_profile: {e}")
        before = len(memory_db.profiles)
        memory_db.profiles = [p for p in memory_db.profiles if p["id"] != user_id]
        return len(memory_db.profiles) < before

    # --- IDEAS & MODERATION ---
    _idea_statuses: Dict[str, str] = local_get_all_idea_statuses()

    @staticmethod
    def _unpack_idea(row: Dict[str, Any]) -> Dict[str, Any]:
        if not row:
            return row
        item = dict(row)
        dedicated = item.get("dedicated_to")
        if dedicated and isinstance(dedicated, str):
            try:
                import json
                meta = json.loads(dedicated)
                if isinstance(meta, dict):
                    for k, v in meta.items():
                        if item.get(k) is None:
                            item[k] = v
            except Exception:
                pass
        return item

    @classmethod
    def get_all_ideas(cls) -> List[Dict[str, Any]]:
        raw: List[Dict[str, Any]] = []
        if is_supabase_connected and supabase_client:
            try:
                res = supabase_client.table("ideas").select("*").order("created_at", desc=True).execute()
                data = _as_dict_list(res.data)
                if data:
                    raw = data
            except Exception as e:
                logger.error(f"Supabase error get_all_ideas: {e}")

        # If Supabase has data, also merge any memory_db ideas not present in Supabase
        existing_ids = {str(item.get("id")) for item in raw}
        for mem in memory_db.ideas:
            if str(mem.get("id")) not in existing_ids:
                raw.append(dict(mem))

        if not raw:
            raw = [dict(m) for m in sorted(memory_db.ideas, key=lambda x: x["created_at"], reverse=True)]

        for item in raw:
            iid = str(item.get("id"))
            item["status"] = cls._idea_statuses.get(iid, str(item.get("status") or "active"))
        return [cls._unpack_idea(item) for item in raw]

    @classmethod
    def get_idea_by_id(cls, idea_id: str) -> Optional[Dict[str, Any]]:
        item: Optional[Dict[str, Any]] = None
        if is_supabase_connected and supabase_client:
            try:
                res = supabase_client.table("ideas").select("*").eq("id", idea_id).execute()
                data = _as_dict_list(res.data)
                if data:
                    item = data[0]
            except Exception as e:
                logger.error(f"Supabase error get_idea_by_id: {e}")
        if not item:
            matched = next((i for i in memory_db.ideas if str(i["id"]) == idea_id), None)
            if matched:
                item = dict(matched)
        if item:
            iid = str(item.get("id"))
            item["status"] = cls._idea_statuses.get(iid, str(item.get("status") or "active"))
            return cls._unpack_idea(item)
        return None

    @classmethod
    def create_idea(cls, idea_data: Dict[str, Any]) -> Dict[str, Any]:
        idea_data["id"] = idea_data.get("id") or str(uuid.uuid4())
        idea_data["created_at"] = idea_data.get("created_at") or datetime.now(timezone.utc).isoformat()
        idea_data["status"] = idea_data.get("status") or "pending"
        cls._idea_statuses[str(idea_data["id"])] = idea_data["status"]
        local_save_idea_status(str(idea_data["id"]), idea_data["status"])

        KNOWN_COLUMNS = {
            "id", "created_at", "stage", "dedicated_to", "title", "essence",
            "user_id", "description", "category", "author_name", "innovation",
            "target_audience", "image_url", "status"
        }
        supabase_payload = {}
        extra_meta = {}
        for k, v in idea_data.items():
            if k == "status":
                continue
            if k in KNOWN_COLUMNS:
                supabase_payload[k] = v
            else:
                extra_meta[k] = v

        if extra_meta:
            import json
            current_dedicated = supabase_payload.get("dedicated_to")
            meta_dict = {}
            if current_dedicated and isinstance(current_dedicated, str):
                try:
                    meta_dict = json.loads(current_dedicated)
                    if not isinstance(meta_dict, dict):
                        meta_dict = {}
                except Exception:
                    meta_dict = {}
            meta_dict.update(extra_meta)
            supabase_payload["dedicated_to"] = json.dumps(meta_dict, ensure_ascii=False)

        if is_supabase_connected and supabase_client:
            try:
                res = supabase_client.table("ideas").insert(supabase_payload).execute()
                data = _as_dict_list(res.data)
                if data:
                    merged = {**data[0], "status": idea_data["status"]}
                    return cls._unpack_idea(merged)
            except Exception as e:
                logger.error(f"Supabase error create_idea: {e}")
        memory_db.ideas.insert(0, idea_data)
        return cls._unpack_idea(idea_data)

    @staticmethod
    def delete_idea(idea_id: str) -> bool:
        if is_supabase_connected and supabase_client:
            try:
                supabase_client.table("reactions").delete().eq("idea_id", idea_id).execute()
                res = supabase_client.table("ideas").delete().eq("id", idea_id).execute()
                return True
            except Exception as e:
                logger.error(f"Supabase error delete_idea: {e}")
        before_count = len(memory_db.ideas)
        memory_db.ideas = [i for i in memory_db.ideas if str(i["id"]) != idea_id]
        memory_db.reactions = [r for r in memory_db.reactions if str(r["idea_id"]) != idea_id]
        return len(memory_db.ideas) < before_count

    @classmethod
    def update_idea(cls, idea_id: str, updates: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        iid = idea_id
        if "status" in updates:
            cls._idea_statuses[iid] = updates["status"]
            local_save_idea_status(iid, updates["status"])

        KNOWN_COLUMNS = {
            "id", "created_at", "stage", "dedicated_to", "title", "essence",
            "user_id", "description", "category", "author_name", "innovation",
            "target_audience", "image_url", "status"
        }
        supabase_payload = {}
        extra_meta = {}
        for k, v in updates.items():
            if k == "status":
                continue
            if k in KNOWN_COLUMNS:
                supabase_payload[k] = v
            else:
                extra_meta[k] = v

        existing = cls.get_idea_by_id(idea_id)
        if extra_meta:
            import json
            current_dedicated = existing.get("dedicated_to") if existing else None
            meta_dict = {}
            if current_dedicated and isinstance(current_dedicated, str):
                try:
                    meta_dict = json.loads(current_dedicated)
                    if not isinstance(meta_dict, dict):
                        meta_dict = {}
                except Exception:
                    meta_dict = {}
            meta_dict.update(extra_meta)
            supabase_payload["dedicated_to"] = json.dumps(meta_dict, ensure_ascii=False)

        item: Optional[Dict[str, Any]] = None
        if is_supabase_connected and supabase_client and supabase_payload:
            try:
                res = supabase_client.table("ideas").update(supabase_payload).eq("id", idea_id).execute()
                data = _as_dict_list(res.data)
                if data:
                    item = data[0]
            except Exception as e:
                logger.error(f"Supabase error update_idea: {e}")

        mem = next((i for i in memory_db.ideas if str(i["id"]) == iid), None)
        if mem:
            mem.update(updates)
            if not item:
                item = dict(mem)

        if item:
            item["status"] = cls._idea_statuses.get(iid, str(updates.get("status") or "active"))
            item = cls._unpack_idea(item)
            item.update(updates)
        elif existing:
            existing.update(updates)
            item = existing
        return item

    # --- TESTER APPLICATIONS (Weryfikacja i akceptacja testerów) ---
    @staticmethod
    def get_tester_applications(
        idea_id: Optional[str] = None,
        user_id: Optional[str] = None,
        user_email: Optional[str] = None,
        status: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        remote_data: Optional[List[Dict[str, Any]]] = None
        if is_supabase_connected and supabase_client:
            try:
                q = supabase_client.table("tester_applications").select("*").order("created_at", desc=True)
                if idea_id:
                    q = q.eq("idea_id", idea_id)
                if user_id:
                    q = q.eq("user_id", user_id)
                if user_email:
                    q = q.eq("user_email", user_email)
                if status:
                    q = q.eq("status", status)
                res = q.execute()
                data = _as_dict_list(res.data)
                if data:
                    remote_data = data
            except Exception as e:
                logger.info(f"Supabase tester_applications fallback: {e}")

        if remote_data is not None and len(remote_data) > 0:
            for itm in remote_data:
                local_save_tester_application(itm)
            return remote_data

        local_data = local_get_tester_applications(idea_id=idea_id, user_id=user_id, user_email=user_email, status=status)
        if local_data:
            return local_data

        res = memory_db.tester_applications
        if idea_id:
            res = [a for a in res if str(a.get("idea_id")) == idea_id]
        if user_id:
            res = [a for a in res if str(a.get("user_id")) == user_id]
        if status:
            res = [a for a in res if a.get("status") == status]
        return sorted(res, key=lambda x: str(x.get("created_at", "")), reverse=True)

    @staticmethod
    def create_tester_application(app_data: Dict[str, Any]) -> Dict[str, Any]:
        app_data["id"] = app_data.get("id") or str(uuid.uuid4())
        app_data["created_at"] = app_data.get("created_at") or datetime.now(timezone.utc).isoformat()
        app_data["status"] = app_data.get("status") or "pending"

        # Zapisz w lokalnej trwałej bazie SQLite (gwarancja braku utraty danych)
        local_save_tester_application(app_data)

        if is_supabase_connected and supabase_client:
            try:
                res = supabase_client.table("tester_applications").insert(app_data).execute()
                data = _as_dict_list(res.data)
                if data:
                    return data[0]
            except Exception as e:
                logger.info(f"Supabase tester_applications insert fallback: {e}")

        memory_db.tester_applications.insert(0, app_data)
        return app_data

    @staticmethod
    def get_tester_application_by_id(app_id: str) -> Optional[Dict[str, Any]]:
        if is_supabase_connected and supabase_client:
            try:
                res = supabase_client.table("tester_applications").select("*").eq("id", app_id).execute()
                data = _as_dict_list(res.data)
                if data:
                    return data[0]
            except Exception as e:
                logger.info(f"Supabase get_tester_application_by_id fallback: {e}")
        local = local_get_tester_application_by_id(app_id)
        if local:
            return local
        return next((a for a in memory_db.tester_applications if str(a.get("id")) == app_id), None)

    @staticmethod
    def update_tester_application(app_id: str, updates: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        local_up = local_update_tester_application(app_id, updates)
        if is_supabase_connected and supabase_client:
            try:
                res = supabase_client.table("tester_applications").update(updates).eq("id", app_id).execute()
                data = _as_dict_list(res.data)
                if data:
                    return data[0]
            except Exception as e:
                logger.info(f"Supabase update_tester_application fallback: {e}")

        if local_up:
            return local_up

        app = next((a for a in memory_db.tester_applications if str(a.get("id")) == app_id), None)
        if app:
            app.update(updates)
            return app
        return None


    # --- REACTIONS ---
    @staticmethod
    def get_reactions_for_idea(idea_id: str) -> List[Dict[str, Any]]:
        if is_supabase_connected and supabase_client:
            try:
                res = supabase_client.table("reactions").select("*").eq("idea_id", idea_id).execute()
                data = _as_dict_list(res.data)
                if data:
                    return data
            except Exception as e:
                logger.error(f"Supabase error get_reactions_for_idea: {e}")
        return [r for r in memory_db.reactions if r["idea_id"] == idea_id]

    @staticmethod
    def toggle_reaction(idea_id: str, user_id: str, reaction_type: str) -> Dict[str, Any]:
        valid_reactions = {"like", "volunteer", "dislike"}
        if reaction_type not in valid_reactions:
            raise ValueError(f"Invalid reaction type: {reaction_type}. Must be one of {valid_reactions}")

        if is_supabase_connected and supabase_client:
            try:
                res = supabase_client.table("reactions").select("*") \
                    .eq("idea_id", idea_id) \
                    .eq("user_id", user_id) \
                    .eq("reaction_type", reaction_type) \
                    .execute()
                data = _as_dict_list(res.data)
                if data:
                    reaction_id = data[0]["id"]
                    supabase_client.table("reactions").delete().eq("id", reaction_id).execute()
                    return {"active": False, "reaction_type": reaction_type}
                else:
                    if reaction_type in ("like", "dislike"):
                        opposite = "dislike" if reaction_type == "like" else "like"
                        try:
                            supabase_client.table("reactions").delete() \
                                .eq("idea_id", idea_id) \
                                .eq("user_id", user_id) \
                                .eq("reaction_type", opposite) \
                                .execute()
                        except Exception:
                            pass
                    new_reaction = {
                        "id": str(uuid.uuid4()),
                        "idea_id": idea_id,
                        "user_id": user_id,
                        "reaction_type": reaction_type,
                        "created_at": datetime.now(timezone.utc).isoformat()
                    }
                    supabase_client.table("reactions").insert(new_reaction).execute()
                    return {"active": True, "reaction_type": reaction_type}
            except Exception as e:
                logger.error(f"Supabase error toggle_reaction: {e}")

        existing = next(
            (r for r in memory_db.reactions 
             if str(r.get("idea_id")) == idea_id and str(r.get("user_id")) == user_id and r.get("reaction_type") == reaction_type),
            None
        )
        if existing:
            memory_db.reactions.remove(existing)
            return {"active": False, "reaction_type": reaction_type}
        else:
            if reaction_type in ("like", "dislike"):
                opposite = "dislike" if reaction_type == "like" else "like"
                memory_db.reactions = [
                    r for r in memory_db.reactions
                    if not (str(r.get("idea_id")) == idea_id and str(r.get("user_id")) == user_id and r.get("reaction_type") == opposite)
                ]
            new_r = {
                "id": str(uuid.uuid4()),
                "idea_id": idea_id,
                "user_id": user_id,
                "reaction_type": reaction_type,
                "created_at": datetime.now(timezone.utc).isoformat()
            }
            memory_db.reactions.append(new_r)
            return {"active": True, "reaction_type": reaction_type}

    # --- TESTING FEEDBACK, USABILITY RATINGS & COMMENTS ---
    @staticmethod
    def get_feedback_for_idea(idea_id: str) -> List[Dict[str, Any]]:
        remote_data: Optional[List[Dict[str, Any]]] = None
        if is_supabase_connected and supabase_client:
            try:
                res = supabase_client.table("idea_feedback").select("*").eq("idea_id", idea_id).order("created_at", desc=True).execute()
                data = _as_dict_list(res.data)
                if data:
                    remote_data = data
            except Exception as e:
                logger.info(f"Supabase idea_feedback fetch fallback: {e}")

        if remote_data is not None and len(remote_data) > 0:
            for itm in remote_data:
                local_save_feedback(itm)
            return remote_data

        local_data = local_get_feedback(idea_id)
        if local_data:
            return local_data

        return [f for f in memory_db.feedback if str(f.get("idea_id")) == idea_id]

    @staticmethod
    def create_feedback(feedback_data: Dict[str, Any]) -> Dict[str, Any]:
        feedback_data["id"] = feedback_data.get("id") or str(uuid.uuid4())
        feedback_data["created_at"] = feedback_data.get("created_at") or datetime.now(timezone.utc).isoformat()
        
        # Trwały zapis w lokalnej bazie SQLite (dane nigdy nie znikną przy restartach serwera)
        local_save_feedback(feedback_data)

        if is_supabase_connected and supabase_client:
            try:
                res = supabase_client.table("idea_feedback").insert(feedback_data).execute()
                data = _as_dict_list(res.data)
                if data:
                    return data[0]
            except Exception as e:
                logger.info(f"Supabase idea_feedback insert fallback: {e}")
        memory_db.feedback.insert(0, feedback_data)
        return feedback_data

    @staticmethod
    def get_comments_for_idea(idea_id: str) -> List[Dict[str, Any]]:
        remote_data: Optional[List[Dict[str, Any]]] = None
        if is_supabase_connected and supabase_client:
            try:
                res = supabase_client.table("idea_comments").select("*").eq("idea_id", idea_id).order("created_at", desc=False).execute()
                data = _as_dict_list(res.data)
                if data:
                    remote_data = data
            except Exception as e:
                logger.info(f"Supabase idea_comments fetch fallback: {e}")

        if remote_data is not None and len(remote_data) > 0:
            for itm in remote_data:
                local_save_comment(itm)
            return remote_data

        local_data = local_get_comments(idea_id)
        if local_data:
            return local_data

        return [c for c in memory_db.comments if str(c.get("idea_id")) == idea_id]

    @staticmethod
    def create_comment(comment_data: Dict[str, Any]) -> Dict[str, Any]:
        comment_data["id"] = comment_data.get("id") or str(uuid.uuid4())
        comment_data["created_at"] = comment_data.get("created_at") or datetime.now(timezone.utc).isoformat()

        # Trwały zapis w lokalnej bazie SQLite (dane nigdy nie znikną przy restartach serwera)
        local_save_comment(comment_data)

        if is_supabase_connected and supabase_client:
            try:
                res = supabase_client.table("idea_comments").insert(comment_data).execute()
                data = _as_dict_list(res.data)
                if data:
                    return data[0]
            except Exception as e:
                logger.info(f"Supabase idea_comments insert fallback: {e}")
        memory_db.comments.append(comment_data)
        return comment_data

    # --- INNOVATIONS (RAG Database) ---
    @staticmethod
    def get_all_innovations() -> List[Dict[str, Any]]:
        if is_supabase_connected and supabase_client:
            try:
                res = supabase_client.table("innovations").select("*").execute()
                data = _as_dict_list(res.data)
                if data:
                    return data
            except Exception as e:
                logger.error(f"Supabase error get_all_innovations: {e}")
        return memory_db.innovations

    @staticmethod
    def get_innovation_by_id(innovation_id: str) -> Optional[Dict[str, Any]]:
        if is_supabase_connected and supabase_client:
            try:
                res = supabase_client.table("innovations").select("*").eq("id", innovation_id).execute()
                data = _as_dict_list(res.data)
                if data:
                    return data[0]
            except Exception as e:
                logger.error(f"Supabase error get_innovation_by_id: {e}")
        return next((i for i in memory_db.innovations if str(i["id"]) == innovation_id), None)

    @staticmethod
    def create_innovation(innovation_data: Dict[str, Any]) -> Dict[str, Any]:
        innovation_data["id"] = innovation_data.get("id") or str(uuid.uuid4())
        innovation_data["created_at"] = innovation_data.get("created_at") or datetime.now(timezone.utc).isoformat()

        if is_supabase_connected and supabase_client:
            try:
                res = supabase_client.table("innovations").insert(innovation_data).execute()
                data = _as_dict_list(res.data)
                if data:
                    return data[0]
            except Exception as e:
                logger.error(f"Supabase error create_innovation: {e}")
        memory_db.innovations.append(innovation_data)
        return innovation_data

    @staticmethod
    def update_innovation(innovation_id: str, updates: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        if is_supabase_connected and supabase_client:
            try:
                res = supabase_client.table("innovations").update(updates).eq("id", innovation_id).execute()
                data = _as_dict_list(res.data)
                if data:
                    return data[0]
            except Exception as e:
                logger.error(f"Supabase error update_innovation: {e}")
        for inn in memory_db.innovations:
            if str(inn["id"]) == innovation_id:
                inn.update(updates)
                return inn
        return None

    @staticmethod
    def match_innovations_pgvector(
        query_vector: List[float],
        match_threshold: float = 0.20,
        match_count: int = 10
    ) -> Optional[List[Dict[str, Any]]]:
        """Wywołuje natywną funkcję RPC pgvector match_innovations w Supabase."""
        if is_supabase_connected and supabase_client:
            try:
                res = supabase_client.rpc(
                    "match_innovations",
                    {
                        "query_embedding": query_vector,
                        "match_threshold": match_threshold,
                        "match_count": match_count
                    }
                ).execute()
                data = _as_dict_list(res.data)
                if data:
                    return data
            except Exception as e:
                logger.info(f"RPC match_innovations niedostępne ({e}), używam hybrydowego wyszukiwania.")
        return None

    @staticmethod
    def save_reported_problem(problem_data: Dict[str, Any]) -> Dict[str, Any]:
        """Zapisuje zgłoszony problem użytkownika do bazy wyzwań społecznych."""
        problem_data["id"] = problem_data.get("id") or str(uuid.uuid4())
        problem_data["created_at"] = problem_data.get("created_at") or datetime.now(timezone.utc).isoformat()

        if is_supabase_connected and supabase_client:
            try:
                payload = {
                    "id": problem_data["id"],
                    "user_id": problem_data.get("user_id") or "938a7411-2c60-451d-88a5-5dab8fe2c23f",
                    "problem_description": problem_data.get("problem_description", ""),
                    "embedding": problem_data.get("embedding")
                }
                res = supabase_client.table("reported_problems").insert(payload).execute()
                data = _as_dict_list(res.data)
                if data:
                    return {**problem_data, **data[0]}
            except Exception as e:
                logger.error(f"Supabase error save_reported_problem: {e}")

        memory_db.reported_problems.append(problem_data)
        return problem_data

    @staticmethod
    def get_reported_problems(limit: int = 50) -> List[Dict[str, Any]]:
        """Pobiera zgłoszone problemy z bazy."""
        if is_supabase_connected and supabase_client:
            try:
                res = supabase_client.table("reported_problems").select("*").order("created_at", desc=True).limit(limit).execute()
                data = _as_dict_list(res.data)
                if data:
                    return data
            except Exception as e:
                logger.error(f"Supabase error get_reported_problems: {e}")
        return memory_db.reported_problems[:limit]

    @staticmethod
    def create_conversation(conv_data: Dict[str, Any]) -> Dict[str, Any]:
        conv_data["id"] = conv_data.get("id") or str(uuid.uuid4())
        now_iso = datetime.now(timezone.utc).isoformat()
        conv_data["created_at"] = conv_data.get("created_at") or now_iso
        conv_data["last_message_at"] = conv_data.get("last_message_at") or now_iso
        conv_data["status"] = conv_data.get("status") or "open"
        conv_data["unread_by_admin"] = conv_data.get("unread_by_admin", 0)
        conv_data["unread_by_user"] = conv_data.get("unread_by_user", 0)

        clean_conv_data = dict(conv_data)
        if clean_conv_data.get("idea_id"):
            try:
                uuid.UUID(str(clean_conv_data["idea_id"]))
            except (ValueError, TypeError):
                clean_conv_data["idea_id"] = None

        if clean_conv_data.get("user_id"):
            try:
                uuid.UUID(str(clean_conv_data["user_id"]))
            except (ValueError, TypeError):
                clean_conv_data["user_id"] = str(uuid.uuid5(uuid.NAMESPACE_DNS, str(clean_conv_data["user_id"])))

        if is_supabase_connected and supabase_client:
            try:
                res = supabase_client.table("chat_conversations").insert(clean_conv_data).execute()
                data = _as_dict_list(res.data)
                if data:
                    return data[0]
            except Exception as e:
                logger.error(f"Supabase error create_conversation: {e}")
        memory_db.conversations.append(conv_data)
        return conv_data

    @staticmethod
    def get_conversation_by_id(conv_id: str) -> Optional[Dict[str, Any]]:
        if is_supabase_connected and supabase_client:
            try:
                res = supabase_client.table("chat_conversations").select("*").eq("id", conv_id).execute()
                data = _as_dict_list(res.data)
                if data:
                    return data[0]
            except Exception as e:
                logger.error(f"Supabase error get_conversation_by_id: {e}")
        return next((c for c in memory_db.conversations if str(c["id"]) == conv_id), None)

    @staticmethod
    def get_conversations(user_id: Optional[str] = None, status: Optional[str] = None) -> List[Dict[str, Any]]:
        if is_supabase_connected and supabase_client:
            try:
                query = supabase_client.table("chat_conversations").select("*").order("last_message_at", desc=True)
                if user_id:
                    query = query.eq("user_id", user_id)
                if status:
                    query = query.eq("status", status)
                res = query.execute()
                data = _as_dict_list(res.data)
                if data:
                    return data
            except Exception as e:
                logger.error(f"Supabase error get_conversations: {e}")

        # In-memory filter
        res = memory_db.conversations
        if user_id:
            res = [c for c in res if str(c.get("user_id")) == user_id]
        if status:
            res = [c for c in res if c.get("status") == status]
        return sorted(res, key=lambda x: x.get("last_message_at", ""), reverse=True)

    @staticmethod
    def update_conversation(conv_id: str, updates: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        if is_supabase_connected and supabase_client:
            try:
                res = supabase_client.table("chat_conversations").update(updates).eq("id", conv_id).execute()
                data = _as_dict_list(res.data)
                if data:
                    return data[0]
            except Exception as e:
                logger.error(f"Supabase error update_conversation: {e}")

        conv = next((c for c in memory_db.conversations if str(c["id"]) == conv_id), None)
        if conv:
            conv.update(updates)
            return conv
        return None

    @staticmethod
    def delete_conversation(conv_id: str) -> bool:
        if is_supabase_connected and supabase_client:
            try:
                supabase_client.table("chat_messages").delete().eq("conversation_id", conv_id).execute()
                supabase_client.table("chat_conversations").delete().eq("id", conv_id).execute()
                return True
            except Exception as e:
                logger.error(f"Supabase error delete_conversation: {e}")
        memory_db.conversations = [c for c in memory_db.conversations if str(c.get("id")) != conv_id]
        memory_db.messages = [m for m in memory_db.messages if str(m.get("conversation_id")) != conv_id]
        return True

    @staticmethod
    def create_message(msg_data: Dict[str, Any]) -> Dict[str, Any]:
        msg_data["id"] = msg_data.get("id") or str(uuid.uuid4())
        msg_data["created_at"] = msg_data.get("created_at") or datetime.now(timezone.utc).isoformat()

        conv_id = str(msg_data["conversation_id"])
        is_user = msg_data.get("sender_role") == "user"

        # Update conversation timestamp & unread counters
        conv_updates: Dict[str, Any] = {
            "last_message_at": msg_data["created_at"],
            "last_message": msg_data["content"][:120]
        }
        conv = DatabaseRepository.get_conversation_by_id(conv_id)
        if conv:
            if is_user:
                conv_updates["unread_by_admin"] = conv.get("unread_by_admin", 0) + 1
            else:
                conv_updates["unread_by_user"] = conv.get("unread_by_user", 0) + 1
                # Jeśli admin odpisuje, a nie był przypisany, przypisz go
                if not conv.get("assigned_admin_id") and msg_data.get("sender_id"):
                    conv_updates["assigned_admin_id"] = msg_data["sender_id"]
                    conv_updates["assigned_admin_name"] = msg_data.get("sender_name", "Ekspert ROPS Kraków")
                    conv_updates["status"] = "in_progress"
            DatabaseRepository.update_conversation(conv_id, conv_updates)

        clean_msg = dict(msg_data)
        if clean_msg.get("sender_id"):
            try:
                uuid.UUID(str(clean_msg["sender_id"]))
            except (ValueError, TypeError):
                clean_msg["sender_id"] = str(uuid.uuid5(uuid.NAMESPACE_DNS, str(clean_msg["sender_id"])))

        if is_supabase_connected and supabase_client:
            try:
                res = supabase_client.table("chat_messages").insert(clean_msg).execute()
                data = _as_dict_list(res.data)
                if data:
                    return data[0]
            except Exception as e:
                logger.error(f"Supabase error create_message: {e}")
        memory_db.messages.append(msg_data)
        return msg_data

    @staticmethod
    def get_messages_for_conversation(
        conv_id: str,
        since: Optional[str] = None,
        after_id: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        """Pobiera wiadomości czatu z obsługą pollingu co 3 sekundy."""
        clean_since = since
        if since:
            try:
                s_norm = since.strip()
                if " " in s_norm and "+" not in s_norm and not s_norm.endswith("Z"):
                    if "T" in s_norm:
                        s_norm = s_norm.replace(" ", "+")
                    else:
                        parts = s_norm.rsplit(" ", 1)
                        if len(parts) == 2 and ":" in parts[1]:
                            s_norm = f"{parts[0]}+{parts[1]}"
                clean_since = datetime.fromisoformat(s_norm).isoformat()
            except Exception:
                clean_since = since

        if is_supabase_connected and supabase_client:
            try:
                query = supabase_client.table("chat_messages").select("*").eq("conversation_id", conv_id).order("created_at", desc=False)
                if clean_since:
                    query = query.gt("created_at", clean_since)
                res = query.execute()
                data = _as_dict_list(res.data)
                if data:
                    msgs = data
                    if after_id:
                        idx = next((i for i, m in enumerate(msgs) if str(m.get("id")) == after_id), -1)
                        if idx != -1:
                            msgs = msgs[idx + 1:]
                    return msgs
            except Exception as e:
                logger.error(f"Supabase error get_messages_for_conversation: {e}")

        # In-memory filter
        matched = [m for m in memory_db.messages if str(m["conversation_id"]) == conv_id]
        sorted_msgs = sorted(matched, key=lambda x: x.get("created_at", ""))
        if clean_since:
            sorted_msgs = [m for m in sorted_msgs if m.get("created_at", "") > clean_since]
        if after_id:
            idx = next((i for i, m in enumerate(sorted_msgs) if str(m.get("id")) == after_id), -1)
            if idx != -1:
                sorted_msgs = sorted_msgs[idx + 1:]
        return sorted_msgs

    @staticmethod
    def mark_conversation_read(conv_id: str, reader_role: str) -> None:
        """Resetuje licznik nieprzeczytanych wiadomości dla danego czytelnika."""
        updates = {}
        if reader_role in ("admin", "expert"):
            updates["unread_by_admin"] = 0
        else:
            updates["unread_by_user"] = 0
        DatabaseRepository.update_conversation(conv_id, updates)

