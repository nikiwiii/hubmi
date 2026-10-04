import logging
import uuid
from functools import lru_cache
from typing import Any, Protocol

from fastapi import HTTPException, status

from app.config import get_settings
from app.repository import supabase_client
from app.schemas import IMAGE_CONTENT_TYPES

logger = logging.getLogger("idea_creator.storage")


class StorageError(Exception):
    pass


class ImageStorage(Protocol):
    def upload(self, data: bytes, content_type: str) -> str:
        """Stores the image and returns its public URL."""
        ...


class SupabaseImageStorage:
    """Public Supabase Storage bucket; files are named by random UUID."""

    def __init__(self, client: Any, bucket: str):
        self._client = client
        self._bucket = bucket

    def upload(self, data: bytes, content_type: str) -> str:
        path = f"{uuid.uuid4()}.{IMAGE_CONTENT_TYPES[content_type]}"
        bucket = self._client.storage.from_(self._bucket)
        try:
            bucket.upload(path, data, {"content-type": content_type, "cache-control": "31536000", "upsert": "false"})
            return bucket.get_public_url(path)
        except Exception as e:
            logger.error("Supabase Storage upload to %s failed: %s: %s", self._bucket, type(e).__name__, str(e)[:300])
            raise StorageError("upload failed") from e


class TemplateStorage(Protocol):
    def upload(self, data: bytes) -> str:
        """Stores a PDF template and returns its public URL."""
        ...


class SupabaseTemplateStorage:
    """Public Supabase Storage bucket for grant call templates (PDF)."""

    def __init__(self, client: Any, bucket: str):
        self._client = client
        self._bucket = bucket

    def upload(self, data: bytes) -> str:
        path = f"{uuid.uuid4()}.pdf"
        bucket = self._client.storage.from_(self._bucket)
        try:
            bucket.upload(path, data, {"content-type": "application/pdf", "upsert": "false"})
            return bucket.get_public_url(path)
        except Exception as e:
            logger.error("Supabase Storage upload to %s failed: %s: %s", self._bucket, type(e).__name__, str(e)[:300])
            raise StorageError("upload failed") from e


def _require_supabase() -> None:
    if not get_settings().supabase_configured:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Baza danych nie jest skonfigurowana (brak SUPABASE_URL / SUPABASE_KEY).",
        )


@lru_cache
def _supabase_storage() -> SupabaseImageStorage:
    return SupabaseImageStorage(supabase_client(), get_settings().supabase_image_bucket)


def get_image_storage() -> ImageStorage:
    _require_supabase()
    return _supabase_storage()


@lru_cache
def _supabase_template_storage() -> SupabaseTemplateStorage:
    return SupabaseTemplateStorage(supabase_client(), get_settings().supabase_template_bucket)


def get_template_storage() -> TemplateStorage:
    _require_supabase()
    return _supabase_template_storage()
