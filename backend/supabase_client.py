import logging
import uuid
from datetime import datetime, timezone
from typing import Optional, List, Dict, Any
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


# ==========================================
# In-memory database fallback implementation
# ==========================================
class MemoryDB:
    def __init__(self):
        self.profiles: List[Dict[str, Any]] = []
        self.ideas: List[Dict[str, Any]] = []
        self.reactions: List[Dict[str, Any]] = []
        self.innovations: List[Dict[str, Any]] = []
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
            "author_id": user_id,
            "author_name": "Jan Kowalski",
            "created_at": datetime.now(timezone.utc).isoformat()
        })
        self.reactions.append({
            "id": str(uuid.uuid4()),
            "idea_id": sample_idea_id,
            "user_id": admin_id,
            "reaction_type": "like",
            "created_at": datetime.now(timezone.utc).isoformat()
        })

        # ============================================================
        # Baza innowacji (Innovations) - Domyślne dane dla RAG matching
        # ============================================================
        from matching.embeddings import compute_embedding

        raw_innovations = [
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
                "file_source": "Innowacja_Edukacyjna_Dysleksja_2025.pdf"
            }
        ]

        for item in raw_innovations:
            # Tworzymy bogaty tekst do embeddingu (problem + opis + grupa docelowa + dofinansowanie)
            text_to_embed = f"{item['title']}. Problem: {item['addressed_problems']}. Grupa docelowa: {item['target_group']}. Dofinansowanie: {item['funding_info']}"
            item["embedding"] = compute_embedding(text_to_embed)
            item["created_at"] = datetime.now(timezone.utc).isoformat()
            self.innovations.append(item)

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
                res = supabase_client.table("profiles").select("*").eq("email", email.lower()).execute()
                if res.data and len(res.data) > 0:
                    return res.data[0]
                return None
            except Exception as e:
                logger.error(f"Supabase error get_profile_by_email: {e}")
        return next((p for p in memory_db.profiles if p["email"].lower() == email.lower()), None)

    @staticmethod
    def get_profile_by_id(user_id: str) -> Optional[Dict[str, Any]]:
        if is_supabase_connected and supabase_client:
            try:
                res = supabase_client.table("profiles").select("*").eq("id", user_id).execute()
                if res.data and len(res.data) > 0:
                    return res.data[0]
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
                res = supabase_client.table("profiles").insert(profile_data).execute()
                if res.data and len(res.data) > 0:
                    return res.data[0]
            except Exception as e:
                logger.error(f"Supabase error create_profile: {e}")
        memory_db.profiles.append(profile_data)
        return profile_data

    # --- IDEAS ---
    @staticmethod
    def get_all_ideas() -> List[Dict[str, Any]]:
        if is_supabase_connected and supabase_client:
            try:
                res = supabase_client.table("ideas").select("*").order("created_at", desc=True).execute()
                if res.data is not None:
                    return res.data
            except Exception as e:
                logger.error(f"Supabase error get_all_ideas: {e}")
        return sorted(memory_db.ideas, key=lambda x: x["created_at"], reverse=True)

    @staticmethod
    def get_idea_by_id(idea_id: str) -> Optional[Dict[str, Any]]:
        if is_supabase_connected and supabase_client:
            try:
                res = supabase_client.table("ideas").select("*").eq("id", idea_id).execute()
                if res.data and len(res.data) > 0:
                    return res.data[0]
                return None
            except Exception as e:
                logger.error(f"Supabase error get_idea_by_id: {e}")
        return next((i for i in memory_db.ideas if i["id"] == idea_id), None)

    @staticmethod
    def create_idea(idea_data: Dict[str, Any]) -> Dict[str, Any]:
        idea_data["id"] = idea_data.get("id") or str(uuid.uuid4())
        idea_data["created_at"] = idea_data.get("created_at") or datetime.now(timezone.utc).isoformat()

        if is_supabase_connected and supabase_client:
            try:
                res = supabase_client.table("ideas").insert(idea_data).execute()
                if res.data and len(res.data) > 0:
                    return res.data[0]
            except Exception as e:
                logger.error(f"Supabase error create_idea: {e}")
        memory_db.ideas.append(idea_data)
        return idea_data

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
        memory_db.ideas = [i for i in memory_db.ideas if i["id"] != idea_id]
        memory_db.reactions = [r for r in memory_db.reactions if r["idea_id"] != idea_id]
        return len(memory_db.ideas) < before_count

    # --- REACTIONS ---
    @staticmethod
    def get_reactions_for_idea(idea_id: str) -> List[Dict[str, Any]]:
        if is_supabase_connected and supabase_client:
            try:
                res = supabase_client.table("reactions").select("*").eq("idea_id", idea_id).execute()
                if res.data is not None:
                    return res.data
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
                if res.data and len(res.data) > 0:
                    reaction_id = res.data[0]["id"]
                    supabase_client.table("reactions").delete().eq("id", reaction_id).execute()
                    return {"active": False, "reaction_type": reaction_type}
                else:
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
             if r["idea_id"] == idea_id and r["user_id"] == user_id and r["reaction_type"] == reaction_type),
            None
        )
        if existing:
            memory_db.reactions.remove(existing)
            return {"active": False, "reaction_type": reaction_type}
        else:
            new_r = {
                "id": str(uuid.uuid4()),
                "idea_id": idea_id,
                "user_id": user_id,
                "reaction_type": reaction_type,
                "created_at": datetime.now(timezone.utc).isoformat()
            }
            memory_db.reactions.append(new_r)
            return {"active": True, "reaction_type": reaction_type}

    # --- INNOVATIONS (RAG Database) ---
    @staticmethod
    def get_all_innovations() -> List[Dict[str, Any]]:
        if is_supabase_connected and supabase_client:
            try:
                res = supabase_client.table("innovations").select("*").execute()
                if res.data and len(res.data) > 0:
                    return res.data
            except Exception as e:
                logger.error(f"Supabase error get_all_innovations: {e}")
        return memory_db.innovations

    @staticmethod
    def get_innovation_by_id(innovation_id: str) -> Optional[Dict[str, Any]]:
        if is_supabase_connected and supabase_client:
            try:
                res = supabase_client.table("innovations").select("*").eq("id", innovation_id).execute()
                if res.data and len(res.data) > 0:
                    return res.data[0]
            except Exception as e:
                logger.error(f"Supabase error get_innovation_by_id: {e}")
        return next((i for i in memory_db.innovations if str(i["id"]) == str(innovation_id)), None)

    @staticmethod
    def create_innovation(innovation_data: Dict[str, Any]) -> Dict[str, Any]:
        innovation_data["id"] = innovation_data.get("id") or str(uuid.uuid4())
        innovation_data["created_at"] = innovation_data.get("created_at") or datetime.now(timezone.utc).isoformat()

        if is_supabase_connected and supabase_client:
            try:
                res = supabase_client.table("innovations").insert(innovation_data).execute()
                if res.data and len(res.data) > 0:
                    return res.data[0]
            except Exception as e:
                logger.error(f"Supabase error create_innovation: {e}")
        memory_db.innovations.append(innovation_data)
        return innovation_data
