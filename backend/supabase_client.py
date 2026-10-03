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
        self._seed_default_data()

    def _seed_default_data(self):
        # Default admin: email: admin@hubmi.com, password: admin
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
            "created_at": datetime.now(timezone.utc).isoformat()
        })
        self.reactions.append({
            "id": str(uuid.uuid4()),
            "idea_id": sample_idea_id,
            "user_id": admin_id,
            "reaction_type": "like",
            "created_at": datetime.now(timezone.utc).isoformat()
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
                if res.data and len(res.data) > 0:
                    return res.data[0]
                return None
            except Exception as e:
                logger.error(f"Supabase error get_profile_by_email: {e}")
                # Fallback to memory
        return next((p for p in memory_db.profiles if p["email"].lower() == email.lower()), None)

    @staticmethod
    def get_profile_by_id(user_id: str) -> Optional[Dict[str, Any]]:
        if is_supabase_connected and supabase_client:
            try:
                res = supabase_client.table("users").select("*").eq("id", user_id).execute()
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
                res = supabase_client.table("users").insert(profile_data).execute()
                if res.data and len(res.data) > 0:
                    return res.data[0]
            except Exception as e:
                logger.error(f"Supabase error create_profile: {e}")
                # Fallback
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
                # Reactions with cascade or manual delete
                supabase_client.table("reactions").delete().eq("idea_id", idea_id).execute()
                res = supabase_client.table("ideas").delete().eq("id", idea_id).execute()
                return True
            except Exception as e:
                logger.error(f"Supabase error delete_idea: {e}")
        before_count = len(memory_db.ideas)
        memory_db.ideas = [i for i in memory_db.ideas if i["id"] != idea_id]
        memory_db.reactions = [r for r in memory_db.reactions if r["idea_id"] != idea_id]
        return len(memory_db.ideas) < before_count

    # --- REACTIONS (like, volunteer, dislike) ---
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
        """Toggles reaction: if user already gave this reaction, removes it. Otherwise adds it."""
        valid_reactions = {"like", "volunteer", "dislike"}
        if reaction_type not in valid_reactions:
            raise ValueError(f"Invalid reaction type: {reaction_type}. Must be one of {valid_reactions}")

        if is_supabase_connected and supabase_client:
            try:
                # Check existing
                res = supabase_client.table("reactions").select("*") \
                    .eq("idea_id", idea_id) \
                    .eq("user_id", user_id) \
                    .eq("reaction_type", reaction_type) \
                    .execute()
                if res.data and len(res.data) > 0:
                    # Remove it
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

        # In-memory toggle
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
