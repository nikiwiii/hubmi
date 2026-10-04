from __future__ import annotations

import logging
from functools import lru_cache
from typing import Any, Optional, List, Dict

from fastapi import HTTPException, status

from app.config import get_settings
from app.schemas import ApplicationOut, CallOut, ProjectCreate, ProjectOut

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
        import json
        row = {column: getattr(project, field) for field, column in FIELD_TO_COLUMN.items()}
        row["stage"] = project.etap.value
        row["category"] = project.category or DEFAULT_CATEGORY
        import uuid as _uuid
        try:
            _uuid.UUID(user_id)
            row["user_id"] = user_id
        except (ValueError, TypeError, AttributeError):
            row["user_id"] = None
        row["author_name"] = author_name
        # Omitted when absent, so publishing without an image works before the image_url migration.
        if image_url:
            row["image_url"] = image_url
        if project.partner_types or project.looking_for_partner:
            row["dedicated_to"] = json.dumps({
                "looking_for_partner": bool(project.looking_for_partner),
                "partner_types": project.partner_types or []
            })
        return row

    @staticmethod
    def _from_row(row: Dict[str, Any]) -> ProjectOut:
        import json
        data = {field: row.get(column) for field, column in FIELD_TO_COLUMN.items()}
        data.update({column: row.get(column) for column in PASSTHROUGH_COLUMNS})
        if not data.get("image_url") and row.get("essence"):
            data["image_url"] = row.get("essence")
        if row.get("dedicated_to"):
            try:
                parsed = json.loads(row["dedicated_to"])
                if isinstance(parsed, dict):
                    data["looking_for_partner"] = parsed.get("looking_for_partner", False)
                    data["partner_types"] = parsed.get("partner_types", [])
            except Exception:
                pass
        return ProjectOut.model_validate(data)

    # ----- storage primitives (Supabase) -----

    def _insert_row(self, row: Dict[str, Any]) -> Dict[str, Any]:
        try:
            res = self._client.table(TABLE_NAME).insert(row).execute()
        except Exception as e:
            logger.error("Supabase insert into %s failed: %s: %s", TABLE_NAME, type(e).__name__, getattr(e, "message", e))
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


CALLS_TABLE = "grant_calls"
APPLICATIONS_TABLE = "grant_applications"

# Internal columns never exposed through CallOut.
CALL_PRIVATE_COLUMNS = ("template_text",)


class GrantsRepository:
    """The only place that knows the `grant_calls` / `grant_applications` tables.

    Subclasses (e.g. the in-memory fake in tests) override `_insert`, `_update` and `_select`.
    """

    def __init__(self, client: Any = None):
        self._client = client

    # ----- calls -----

    def create_call(self, row: Dict[str, Any]) -> CallOut:
        return self._call_out(self._insert(CALLS_TABLE, row))

    def update_call(self, call_id: str, values: Dict[str, Any]) -> Optional[CallOut]:
        row = self._update(CALLS_TABLE, call_id, values)
        return self._call_out(row) if row else None

    def get_call(self, call_id: str) -> Optional[CallOut]:
        rows = self._select(CALLS_TABLE, {"id": call_id})
        return self._call_out(rows[0]) if rows else None

    def get_call_template_text(self, call_id: str) -> Optional[str]:
        rows = self._select(CALLS_TABLE, {"id": call_id})
        return rows[0].get("template_text") if rows else None

    def list_calls(self) -> List[CallOut]:
        return [self._call_out(row) for row in self._select(CALLS_TABLE, {})]

    # ----- applications -----

    def create_application(self, row: Dict[str, Any]) -> ApplicationOut:
        return ApplicationOut.model_validate(self._insert(APPLICATIONS_TABLE, row))

    def update_application(self, application_id: str, values: Dict[str, Any]) -> Optional[ApplicationOut]:
        row = self._update(APPLICATIONS_TABLE, application_id, values)
        return ApplicationOut.model_validate(row) if row else None

    def get_application(self, application_id: str) -> Optional[ApplicationOut]:
        rows = self._select(APPLICATIONS_TABLE, {"id": application_id})
        return ApplicationOut.model_validate(rows[0]) if rows else None

    def list_applications(self, **filters: str) -> List[ApplicationOut]:
        return [ApplicationOut.model_validate(row) for row in self._select(APPLICATIONS_TABLE, filters)]

    # ----- mapping -----

    @staticmethod
    def _call_out(row: Dict[str, Any]) -> CallOut:
        return CallOut.model_validate({k: v for k, v in row.items() if k not in CALL_PRIVATE_COLUMNS})

    # ----- storage primitives (Supabase) -----

    def _insert(self, table: str, row: Dict[str, Any]) -> Dict[str, Any]:
        try:
            res = self._client.table(table).insert(row).execute()
        except Exception as e:
            logger.error("Supabase insert into %s failed: %s: %s", table, type(e).__name__, getattr(e, "message", e))
            raise RepositoryError("insert failed") from e
        if not res.data:
            raise RepositoryError("insert returned no data")
        return res.data[0]

    def _update(self, table: str, row_id: str, values: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        try:
            res = self._client.table(table).update(values).eq("id", row_id).execute()
        except Exception as e:
            logger.error("Supabase update of %s failed: %s: %s", table, type(e).__name__, getattr(e, "message", e))
            raise RepositoryError("update failed") from e
        return res.data[0] if res.data else None

    def _select(self, table: str, filters: Dict[str, str]) -> List[Dict[str, Any]]:
        """Rows matching all `filters` (column == value), newest first."""
        try:
            query = self._client.table(table).select("*")
            for column, value in filters.items():
                query = query.eq(column, value)
            res = query.order("created_at", desc=True).execute()
        except Exception as e:
            logger.error("Supabase select from %s failed: %s", table, type(e).__name__)
            raise RepositoryError("select failed") from e
        return res.data or []


@lru_cache
def supabase_client() -> Any:
    from supabase import create_client

    settings = get_settings()
    return create_client(settings.supabase_url, settings.supabase_key)


@lru_cache
def _supabase_repository() -> IdeasRepository:
    return IdeasRepository(supabase_client())


def _require_supabase() -> None:
    if not get_settings().supabase_configured:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Baza danych nie jest skonfigurowana (brak SUPABASE_URL / SUPABASE_KEY).",
        )


def get_repository() -> IdeasRepository:
    _require_supabase()
    return _supabase_repository()


@lru_cache
def _supabase_grants_repository() -> GrantsRepository:
    return GrantsRepository(supabase_client())


def get_grants_repository() -> GrantsRepository:
    _require_supabase()
    return _supabase_grants_repository()
