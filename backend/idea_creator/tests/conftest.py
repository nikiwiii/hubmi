import json
import uuid
from datetime import datetime, timezone
from typing import Any, Optional

import jwt
import pytest
from fastapi.testclient import TestClient

from app.config import Settings, get_settings
from app.main import app
from app.repository import IdeasRepository, get_repository
from app.routers.assistant import assistant_rate_limiter
from app.services.llm import get_llm

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
        return list(reversed(self.rows))

    def _select_row(self, project_id) -> Optional[dict]:
        self.calls += 1
        return next((r for r in self.rows if r["id"] == project_id), None)


class FakeLLM:
    """Returns scripted responses in order and records the messages it received."""

    def __init__(self, responses: list):
        self.responses = list(responses)
        self.received: list[list[dict]] = []

    async def chat_json(self, messages):
        self.received.append([dict(m) for m in messages])
        item = self.responses.pop(0)
        return item if isinstance(item, str) else json.dumps(item, ensure_ascii=False)


@pytest.fixture
def repo():
    return FakeIdeasRepository()


@pytest.fixture
def llm():
    return FakeLLM([])


@pytest.fixture
def client(repo, llm):
    app.dependency_overrides[get_settings] = lambda: TEST_SETTINGS
    app.dependency_overrides[get_repository] = lambda: repo
    app.dependency_overrides[get_llm] = lambda: llm
    assistant_rate_limiter.reset()
    with TestClient(app) as c:
        yield c
    app.dependency_overrides.clear()
    assistant_rate_limiter.reset()


def make_token(sub: str = None, name: str = "Jan Kowalski", **extra) -> str:
    payload = {"sub": sub or str(uuid.uuid4()), "email": "jan@example.com", "role": "user", "name": name, **extra}
    return jwt.encode(payload, TEST_SETTINGS.jwt_secret, algorithm=TEST_SETTINGS.jwt_algorithm)


def auth_header(token: str) -> dict:
    return {"Authorization": f"Bearer {token}"}
