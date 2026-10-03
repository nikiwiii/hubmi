from __future__ import annotations

import logging
from functools import lru_cache
from typing import Any, Optional, List, Dict

from fastapi import HTTPException, status

from app.config import get_settings
from app.schemas import ProjectCreate, ProjectOut

logger = logging.getLogger("idea_creator.repository")

TABLE_NAME = "ideas"
DEFAULT_CATEGORY = "general"

# API field (Polish) -> ideas column
FIELD_TO_COLUMN: dict[str, str] = {
    "tytul": "title",
    "opis": "description",
    "innowacyjnosc": "innovation",
    "odbiorcy": "target_audience",
    "etap": "stage",
}

PASSTHROUGH_COLUMNS = (
    "id", "category", "user_id", "author_name", "image_url", "created_at",
    "looking_for_partner", "partner_types", "assigned_expert_id", "assigned_expert_name", "assigned_expert_specialization"
)


class RepositoryError(Exception):
    pass


class IdeasRepository:
    """The only place that knows the `ideas` table name and its columns.

    Subclasses (e.g. the in-memory fake in tests) override the `_insert_row`,
    `_select_rows` and `_select_row` primitives; the mapping stays here.
    """

    def __init__(self, client: Any = None):
        self._client = client

    # ----- public API -----

    def create(
        self, project: ProjectCreate, user_id: str, author_name: str, image_url: Optional[str] = None
    ) -> ProjectOut:
        return self._from_row(self._insert_row(self._to_row(project, user_id, author_name, image_url)))

    def list(self) -> List[ProjectOut]:
        return [self._from_row(row) for row in self._select_rows()]

    def get(self, project_id: str) -> Optional[ProjectOut]:
        row = self._select_row(project_id)
        return self._from_row(row) if row else None

    # ----- mapping -----

    @staticmethod
    def _to_row(
        project: ProjectCreate, user_id: str, author_name: str, image_url: Optional[str] = None
    ) -> Dict[str, Any]:
        row = {column: getattr(project, field) for field, column in FIELD_TO_COLUMN.items()}
        row["stage"] = project.etap.value
        row["category"] = project.category or DEFAULT_CATEGORY
        row["user_id"] = user_id
        row["author_name"] = author_name
        row["looking_for_partner"] = bool(project.looking_for_partner)
        row["partner_types"] = project.partner_types or []
        # Omitted when absent, so publishing without an image works before the image_url migration.
        if image_url:
            row["image_url"] = image_url
        return row

    @staticmethod
    def _from_row(row: Dict[str, Any]) -> ProjectOut:
        data = {field: row.get(column) for field, column in FIELD_TO_COLUMN.items()}
        data.update({column: row.get(column) for column in PASSTHROUGH_COLUMNS})
        return ProjectOut.model_validate(data)

    # ----- storage primitives (Supabase) -----

    def _insert_row(self, row: Dict[str, Any]) -> Dict[str, Any]:
        try:
            res = self._client.table(TABLE_NAME).insert(row).execute()
        except Exception as e:
            logger.error("Supabase insert into %s failed: %s", TABLE_NAME, type(e).__name__)
            raise RepositoryError("insert failed") from e
        if not res.data:
            raise RepositoryError("insert returned no data")
        return res.data[0]

    def _select_rows(self) -> List[Dict[str, Any]]:
        try:
            res = self._client.table(TABLE_NAME).select("*").order("created_at", desc=True).execute()
        except Exception as e:
            logger.error("Supabase select from %s failed: %s", TABLE_NAME, type(e).__name__)
            raise RepositoryError("select failed") from e
        return res.data or []

    def _select_row(self, project_id: str) -> Optional[Dict[str, Any]]:
        try:
            res = self._client.table(TABLE_NAME).select("*").eq("id", project_id).limit(1).execute()
        except Exception as e:
            logger.error("Supabase select by id from %s failed: %s", TABLE_NAME, type(e).__name__)
            raise RepositoryError("select failed") from e
        return res.data[0] if res.data else None


@lru_cache
def supabase_client() -> Any:
    from supabase import create_client

    settings = get_settings()
    return create_client(settings.supabase_url, settings.supabase_key)


@lru_cache
def _supabase_repository() -> IdeasRepository:
    return IdeasRepository(supabase_client())


def get_repository() -> IdeasRepository:
    if not get_settings().supabase_configured:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Baza danych nie jest skonfigurowana (brak SUPABASE_URL / SUPABASE_KEY).",
        )
    return _supabase_repository()
