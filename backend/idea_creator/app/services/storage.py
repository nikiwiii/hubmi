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
        except Exception:
            try:
                self._client.storage.create_bucket(self._bucket, options={"public": True})
                bucket = self._client.storage.from_(self._bucket)
                bucket.upload(path, data, {"content-type": content_type, "cache-control": "31536000", "upsert": "false"})
                return bucket.get_public_url(path)
            except Exception as e:
                logger.error("Supabase Storage upload to %s failed: %s: %s", self._bucket, type(e).__name__, str(e)[:300])
                raise StorageError("upload failed") from e


@lru_cache
def _supabase_storage() -> SupabaseImageStorage:
    return SupabaseImageStorage(supabase_client(), get_settings().supabase_image_bucket)


def get_image_storage() -> ImageStorage:
    if not get_settings().supabase_configured:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Baza danych nie jest skonfigurowana (brak SUPABASE_URL / SUPABASE_KEY).",
        )
    return _supabase_storage()
