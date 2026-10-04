import json
import uuid
from datetime import datetime, timezone
from typing import Any, Optional

import jwt
import pytest
from fastapi.testclient import TestClient

from app.config import Settings, get_settings
from app.main import app
from app.repository import GrantsRepository, IdeasRepository, get_grants_repository, get_repository
from app.routers.applications import grants_rate_limiter
from app.routers.assistant import assistant_rate_limiter
from app.routers.visualize import image_rate_limiter
from app.services.images import ImageGenerationError, get_image_generator
from app.services.llm import get_llm
from app.services.storage import StorageError, get_image_storage, get_template_storage

TEST_SETTINGS = Settings(
    _env_file=None,
    supabase_url="",
    supabase_key="",
    groq_api_key="test-key",
    groq_model="test-model",
    jwt_secret="test-secret-for-idea-creator-tests-32chars",
    jwt_algorithm="HS256",
)


class FakeIdeasRepository(IdeasRepository):
    """In-memory storage; mapping logic is inherited from the real repository."""

    def __init__(self):
        super().__init__(client=None)
        self.rows: list[dict[str, Any]] = []
        self.calls = 0

    def _insert_row(self, row):
        self.calls += 1
        stored = {**row, "id": str(uuid.uuid4()), "created_at": datetime.now(timezone.utc).isoformat()}
        self.rows.append(stored)
        return stored

    def _select_rows(self):
        self.calls += 1
        return self.rows[::-1]

    def _select_row(self, project_id) -> Optional[dict]:
        self.calls += 1
        return next((r for r in self.rows if r["id"] == project_id), None)


class FakeGrantsRepository(GrantsRepository):
    """In-memory tables; mapping logic is inherited from the real repository."""

    def __init__(self):
        super().__init__(client=None)
        self.tables: dict[str, list[dict[str, Any]]] = {}

    def _insert(self, table, row):
        stored = {**row, "id": str(uuid.uuid4()), "created_at": datetime.now(timezone.utc).isoformat()}
        self.tables.setdefault(table, []).append(stored)
        return stored

    def _update(self, table, row_id, values):
        for row in self.tables.get(table, []):
            if row["id"] == row_id:
                row.update(values)
                return dict(row)
        return None

    def _select(self, table, filters):
        rows = [r for r in self.tables.get(table, []) if all(r.get(k) == v for k, v in filters.items())]
        return [dict(r) for r in rows[::-1]]


class FakeTemplateStorage:
    def __init__(self):
        self.uploads: list[bytes] = []

    def upload(self, data):
        self.uploads.append(data)
        return f"https://storage.test/grant-templates/{len(self.uploads)}.pdf"


class FakeLLM:
    """Returns scripted responses in order and records the messages it received."""

    def __init__(self, responses: list):
        self.responses = list(responses)
        self.received: list[list[dict]] = []

    async def chat_json(self, messages):
        self.received.append([dict(m) for m in messages])
        item = self.responses.pop(0)
        return item if isinstance(item, str) else json.dumps(item, ensure_ascii=False)


class FakeImageGenerator:
    """Returns fixed PNG bytes (or fails) and records the prompts it received."""

    model = "test-image-model"

    def __init__(self):
        self.prompts: list[str] = []
        self.fail = False
        self.fail_status = None

    async def generate(self, prompt):
        self.prompts.append(prompt)
        if self.fail:
            raise ImageGenerationError("boom", self.fail_status)
        return b"\x89PNG-fake", "image/png"


class FakeImageStorage:
    """Records uploads and returns a fake public URL (or fails)."""

    def __init__(self):
        self.uploads: list[tuple[bytes, str]] = []
        self.fail = False

    def upload(self, data, content_type):
        if self.fail:
            raise StorageError("boom")
        self.uploads.append((data, content_type))
        return f"https://storage.test/idea-images/{len(self.uploads)}.png"


@pytest.fixture
def repo():
    return FakeIdeasRepository()


@pytest.fixture
def storage():
    return FakeImageStorage()


@pytest.fixture
def llm():
    return FakeLLM([])


@pytest.fixture
def images():
    return FakeImageGenerator()


@pytest.fixture
def grants():
    return FakeGrantsRepository()


@pytest.fixture
def template_storage():
    return FakeTemplateStorage()


@pytest.fixture
def client(repo, llm, images, storage, grants, template_storage):
    app.dependency_overrides[get_settings] = lambda: TEST_SETTINGS
    app.dependency_overrides[get_repository] = lambda: repo
    app.dependency_overrides[get_image_storage] = lambda: storage
    app.dependency_overrides[get_llm] = lambda: llm
    app.dependency_overrides[get_image_generator] = lambda: images
    app.dependency_overrides[get_grants_repository] = lambda: grants
    app.dependency_overrides[get_template_storage] = lambda: template_storage
    for limiter in (assistant_rate_limiter, image_rate_limiter, grants_rate_limiter):
        limiter.reset()
    with TestClient(app) as c:
        yield c
    app.dependency_overrides.clear()
    for limiter in (assistant_rate_limiter, image_rate_limiter, grants_rate_limiter):
        limiter.reset()


def make_token(sub: str = None, name: str = "Jan Kowalski", **extra) -> str:
    payload = {"sub": sub or str(uuid.uuid4()), "email": "jan@example.com", "role": "user", "name": name, **extra}
    return jwt.encode(payload, TEST_SETTINGS.jwt_secret, algorithm=TEST_SETTINGS.jwt_algorithm)


def auth_header(token: str) -> dict:
    return {"Authorization": f"Bearer {token}"}
