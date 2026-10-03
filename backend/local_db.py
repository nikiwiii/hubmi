import sqlite3
import os
import logging
from typing import List, Dict, Any, Optional
from datetime import datetime, timezone

logger = logging.getLogger("hubmi.local_db")

DB_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "data")
DB_PATH = os.path.join(DB_DIR, "hubmi_local.db")

def _get_connection() -> sqlite3.Connection:
    os.makedirs(DB_DIR, exist_ok=True)
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_local_db():
    """Tworzy tabele w lokalnej bazie SQLite, zapewniając trwałość danych nawet przy braku tabel w Supabase."""
    conn = _get_connection()
    try:
        cursor = conn.cursor()
        
        # Tabela 1: Oceny użyteczności & Feedback testerów
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS idea_feedback (
                id TEXT PRIMARY KEY,
                idea_id TEXT NOT NULL,
                user_id TEXT,
                author_name TEXT NOT NULL,
                author_role TEXT DEFAULT 'Tester społeczny',
                overall_rating INTEGER NOT NULL,
                usability_rating INTEGER NOT NULL,
                accessibility_rating INTEGER NOT NULL,
                impact_rating INTEGER NOT NULL,
                strengths TEXT,
                weaknesses TEXT,
                suggested_improvements TEXT,
                comment TEXT,
                created_at TEXT NOT NULL
            );
        """)
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_local_feedback_idea ON idea_feedback(idea_id);")

        # Tabela 2: Komentarze w wątkach dyskusyjnych o prototypach
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS idea_comments (
                id TEXT PRIMARY KEY,
                idea_id TEXT NOT NULL,
                user_id TEXT,
                author_name TEXT NOT NULL,
                content TEXT NOT NULL,
                created_at TEXT NOT NULL
            );
        """)
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_local_comments_idea ON idea_comments(idea_id);")

        # Tabela 3: Zgłoszenia testerów innowacji
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS tester_applications (
                id TEXT PRIMARY KEY,
                idea_id TEXT NOT NULL,
                idea_title TEXT NOT NULL,
                user_id TEXT,
                user_name TEXT NOT NULL,
                user_email TEXT,
                status TEXT NOT NULL DEFAULT 'pending',
                motivation TEXT,
                created_at TEXT NOT NULL
            );
        """)
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_local_tester_apps_idea ON tester_applications(idea_id);")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_local_tester_apps_status ON tester_applications(status);")

        # Tabela 4: Statusy moderacji pomysłów (pending/active/rejected)
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS idea_statuses (
                idea_id TEXT PRIMARY KEY,
                status TEXT NOT NULL,
                updated_at TEXT NOT NULL
            );
        """)

        conn.commit()
        logger.info(f"Lokalna baza SQLite zainicjalizowana pomyślnie w {DB_PATH}")
    finally:
        conn.close()

# --- FEEDBACK ---
def local_save_feedback(data: Dict[str, Any]) -> Dict[str, Any]:
    conn = _get_connection()
    try:
        cursor = conn.cursor()
        cursor.execute("""
            INSERT OR REPLACE INTO idea_feedback (
                id, idea_id, user_id, author_name, author_role,
                overall_rating, usability_rating, accessibility_rating, impact_rating,
                strengths, weaknesses, suggested_improvements, comment, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            str(data["id"]),
            str(data["idea_id"]),
            str(data.get("user_id")) if data.get("user_id") else None,
            str(data.get("author_name", "Anonimowy tester")),
            str(data.get("author_role", "Tester społeczny")),
            int(data.get("overall_rating", 5)),
            int(data.get("usability_rating", 5)),
            int(data.get("accessibility_rating", 5)),
            int(data.get("impact_rating", 5)),
            data.get("strengths"),
            data.get("weaknesses"),
            data.get("suggested_improvements"),
            data.get("comment"),
            str(data.get("created_at", datetime.now(timezone.utc).isoformat()))
        ))
        conn.commit()
        return data
    finally:
        conn.close()

def local_get_feedback(idea_id: str) -> List[Dict[str, Any]]:
    conn = _get_connection()
    try:
        cursor = conn.cursor()
        cursor.execute(
            "SELECT * FROM idea_feedback WHERE idea_id = ? ORDER BY created_at DESC",
            (str(idea_id),)
        )
        rows = cursor.fetchall()
        return [dict(row) for row in rows]
    finally:
        conn.close()

# --- COMMENTS ---
def local_save_comment(data: Dict[str, Any]) -> Dict[str, Any]:
    conn = _get_connection()
    try:
        cursor = conn.cursor()
        cursor.execute("""
            INSERT OR REPLACE INTO idea_comments (
                id, idea_id, user_id, author_name, content, created_at
            ) VALUES (?, ?, ?, ?, ?, ?)
        """, (
            str(data["id"]),
            str(data["idea_id"]),
            str(data.get("user_id")) if data.get("user_id") else None,
            str(data.get("author_name", "Użytkownik")),
            str(data.get("content", "")),
            str(data.get("created_at", datetime.now(timezone.utc).isoformat()))
        ))
        conn.commit()
        return data
    finally:
        conn.close()

def local_get_comments(idea_id: str) -> List[Dict[str, Any]]:
    conn = _get_connection()
    try:
        cursor = conn.cursor()
        cursor.execute(
            "SELECT * FROM idea_comments WHERE idea_id = ? ORDER BY created_at ASC",
            (str(idea_id),)
        )
        rows = cursor.fetchall()
        return [dict(row) for row in rows]
    finally:
        conn.close()

# --- TESTER APPLICATIONS ---
def local_save_tester_application(data: Dict[str, Any]) -> Dict[str, Any]:
    conn = _get_connection()
    try:
        cursor = conn.cursor()
        cursor.execute("""
            INSERT OR REPLACE INTO tester_applications (
                id, idea_id, idea_title, user_id, user_name, user_email, status, motivation, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            str(data["id"]),
            str(data["idea_id"]),
            str(data.get("idea_title", "")),
            str(data.get("user_id")) if data.get("user_id") else None,
            str(data.get("user_name", "Anonimowy")),
            str(data.get("user_email")) if data.get("user_email") else None,
            str(data.get("status", "pending")),
            data.get("motivation"),
            str(data.get("created_at", datetime.now(timezone.utc).isoformat()))
        ))
        conn.commit()
        return data
    finally:
        conn.close()

def local_get_tester_applications(
    idea_id: Optional[str] = None,
    user_id: Optional[str] = None,
    status: Optional[str] = None
) -> List[Dict[str, Any]]:
    conn = _get_connection()
    try:
        cursor = conn.cursor()
        query = "SELECT * FROM tester_applications WHERE 1=1"
        params = []
        if idea_id:
            query += " AND idea_id = ?"
            params.append(str(idea_id))
        if user_id:
            query += " AND user_id = ?"
            params.append(str(user_id))
        if status:
            query += " AND status = ?"
            params.append(str(status))
        query += " ORDER BY created_at DESC"
        cursor.execute(query, params)
        rows = cursor.fetchall()
        return [dict(row) for row in rows]
    finally:
        conn.close()

def local_get_tester_application_by_id(app_id: str) -> Optional[Dict[str, Any]]:
    conn = _get_connection()
    try:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM tester_applications WHERE id = ?", (str(app_id),))
        row = cursor.fetchone()
        return dict(row) if row else None
    finally:
        conn.close()

def local_update_tester_application(app_id: str, updates: Dict[str, Any]) -> Optional[Dict[str, Any]]:
    conn = _get_connection()
    try:
        cursor = conn.cursor()
        existing = local_get_tester_application_by_id(app_id)
        if not existing:
            return None
        existing.update(updates)
        cursor.execute("""
            UPDATE tester_applications
            SET status = ?, motivation = ?
            WHERE id = ?
        """, (
            str(existing.get("status", "pending")),
            existing.get("motivation"),
            str(app_id)
        ))
        conn.commit()
        return existing
    finally:
        conn.close()

# --- IDEA STATUSES ---
def local_save_idea_status(idea_id: str, status: str):
    conn = _get_connection()
    try:
        cursor = conn.cursor()
        now = datetime.now(timezone.utc).isoformat()
        cursor.execute("""
            INSERT OR REPLACE INTO idea_statuses (idea_id, status, updated_at)
            VALUES (?, ?, ?)
        """, (str(idea_id), str(status), now))
        conn.commit()
    finally:
        conn.close()

def local_get_all_idea_statuses() -> Dict[str, str]:
    conn = _get_connection()
    try:
        cursor = conn.cursor()
        cursor.execute("SELECT idea_id, status FROM idea_statuses")
        rows = cursor.fetchall()
        return {row["idea_id"]: row["status"] for row in rows}
    finally:
        conn.close()

# Automatyczna inicjalizacja bazy przy imporcie
init_local_db()
