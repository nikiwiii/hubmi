import base64
import logging
from functools import lru_cache
from typing import Protocol
from urllib.parse import quote

import httpx
from fastapi import HTTPException, status

from app.config import get_settings

logger = logging.getLogger("idea_creator.images")


class ImageGenerationError(Exception):
    def __init__(self, message: str, status_code: int | None = None):
        super().__init__(message)
        self.status_code = status_code


class ImageGenerator(Protocol):
    model: str

    async def generate(self, prompt: str) -> tuple[bytes, str]:
        """Returns (image bytes, content type)."""
        ...


class PollinationsImageClient:
    """Pollinations image API: GET {base_url}/image/{prompt}?model=..."""

    def __init__(self, api_key: str, model: str, base_url: str, timeout: float, width: int, height: int):
        self._api_key = api_key
        self.model = model
        self._base_url = base_url.rstrip("/")
        self._timeout = timeout
        self._width = width
        self._height = height

    async def generate(self, prompt: str) -> tuple[bytes, str]:
        url = f"{self._base_url}/image/{quote(prompt, safe='')}"
        params = {"model": self.model, "width": self._width, "height": self._height, "nologo": "true"}
        headers = {"Authorization": f"Bearer {self._api_key}"}
        try:
            async with httpx.AsyncClient(timeout=self._timeout) as client:
                response = await client.get(url, params=params, headers=headers)
        except httpx.HTTPError as e:
            logger.error("Pollinations request failed: %s", type(e).__name__)
            raise ImageGenerationError(type(e).__name__) from e

        content_type = response.headers.get("content-type", "").split(";")[0].strip()
        if response.status_code != 200 or not content_type.startswith("image/"):
            logger.error("Pollinations returned %s (%s): %s", response.status_code, content_type, response.text[:300])
            raise ImageGenerationError(f"HTTP {response.status_code}", response.status_code)
        return response.content, content_type


def to_data_url(data: bytes, content_type: str) -> str:
    return f"data:{content_type};base64,{base64.b64encode(data).decode('ascii')}"


@lru_cache
def _pollinations_client() -> PollinationsImageClient:
    settings = get_settings()
    return PollinationsImageClient(
        api_key=settings.pollinations_api_key,
        model=settings.pollinations_image_model,
        base_url=settings.pollinations_base_url,
        timeout=settings.pollinations_timeout_seconds,
        width=settings.image_width,
        height=settings.image_height,
    )


def get_image_generator() -> ImageGenerator:
    if not get_settings().pollinations_api_key:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Generowanie obrazów nie jest skonfigurowane (brak POLLINATIONS_API_KEY).",
        )
    return _pollinations_client()
