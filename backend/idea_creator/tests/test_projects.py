import base64
import uuid

import jwt
import pytest

from app.schemas import MAX_IMAGE_BYTES, Stage
from tests.conftest import auth_header, make_token

PROJECT = {
    "tytul": "Sąsiedzka lodówka",
    "opis": "Ogólnodostępna lodówka w bramie bloku.",
    "innowacyjnosc": "Prowadzona przez samych mieszkańców.",
    "odbiorcy": "Mieszkańcy osiedla.",
    "etap": "prototyp",
}

PNG_BYTES = b"\x89PNG-fake-image"
PNG_DATA_URL = "data:image/png;base64," + base64.b64encode(PNG_BYTES).decode()


def test_publish_with_image_uploads_it_and_stores_url(client, repo, storage):
    res = client.post("/projects", json={**PROJECT, "image": PNG_DATA_URL}, headers=auth_header(make_token()))
    assert res.status_code == 201
    assert storage.uploads == [(PNG_BYTES, "image/png")]
    assert repo.rows[0]["image_url"] == "https://storage.test/idea-images/1.png"
    assert "image" not in repo.rows[0]
    assert res.json()["image_url"] == "https://storage.test/idea-images/1.png"


def test_publish_without_image_omits_image_column(client, repo, storage):
    res = client.post("/projects", json={**PROJECT, "image": ""}, headers=auth_header(make_token()))
    assert res.status_code == 201
    assert storage.uploads == []
    assert "image_url" not in repo.rows[0]
    assert res.json()["image_url"] is None


@pytest.mark.parametrize(
    "image",
    [
        "https://example.com/a.png",
        "data:image/gif;base64," + base64.b64encode(b"GIF89a").decode(),
        "data:image/png;base64,@@not-base64@@",
        "data:image/png;base64," + base64.b64encode(b"x" * (MAX_IMAGE_BYTES + 1)).decode(),
    ],
)
def test_publish_rejects_invalid_image(client, repo, storage, image):
    res = client.post("/projects", json={**PROJECT, "image": image}, headers=auth_header(make_token()))
    assert res.status_code == 422
    assert storage.uploads == []
    assert repo.rows == []


def test_publish_storage_failure_is_502_and_saves_nothing(client, repo, storage):
    storage.fail = True
    res = client.post("/projects", json={**PROJECT, "image": PNG_DATA_URL}, headers=auth_header(make_token()))
    assert res.status_code == 502
    assert repo.rows == []


def test_publish_requires_auth(client, repo):
    res = client.post("/projects", json=PROJECT)
    assert res.status_code == 401
    assert repo.rows == []


def test_publish_rejects_invalid_token(client, repo):
    res = client.post("/projects", json=PROJECT, headers=auth_header("not-a-jwt"))
    assert res.status_code == 401


def test_publish_rejects_token_signed_with_other_secret(client, repo):
    token = jwt.encode({"sub": str(uuid.uuid4()), "name": "X"}, "other-secret-other-secret-32chars!", "HS256")
    res = client.post("/projects", json=PROJECT, headers=auth_header(token))
    assert res.status_code == 401
    assert repo.rows == []


def test_publish_maps_columns_and_uses_token_identity(client, repo):
    user_id = str(uuid.uuid4())
    res = client.post("/projects", json=PROJECT, headers=auth_header(make_token(sub=user_id, name="Anna Nowak")))
    assert res.status_code == 201

    assert len(repo.rows) == 1
    row = repo.rows[0]
    assert row["title"] == PROJECT["tytul"]
    assert row["description"] == PROJECT["opis"]
    assert row["innovation"] == PROJECT["innowacyjnosc"]
    assert row["target_audience"] == PROJECT["odbiorcy"]
    assert row["stage"] == "prototyp"
    assert row["category"] == "general"
    assert row["user_id"] == user_id
    assert row["author_name"] == "Anna Nowak"
    assert not {"tytul", "opis", "innowacyjnosc", "odbiorcy", "etap"} & row.keys()

    body = res.json()
    for field in ("tytul", "opis", "innowacyjnosc", "odbiorcy", "etap"):
        assert body[field] == PROJECT[field]
    assert body["id"] == row["id"]
    assert body["created_at"]
    assert body["user_id"] == user_id
    assert body["author_name"] == "Anna Nowak"


def test_publish_without_name_claim_uses_anonim(client, repo):
    token = make_token(name=None)
    res = client.post("/projects", json=PROJECT, headers=auth_header(token))
    assert res.status_code == 201
    assert repo.rows[0]["author_name"] == "Anonim"


def test_publish_custom_category(client, repo):
    res = client.post("/projects", json={**PROJECT, "category": "Ekologia"}, headers=auth_header(make_token()))
    assert res.status_code == 201
    assert repo.rows[0]["category"] == "Ekologia"
    assert res.json()["category"] == "Ekologia"


@pytest.mark.parametrize("stage", [s.value for s in Stage])
def test_publish_accepts_all_stages(client, repo, stage):
    res = client.post("/projects", json={**PROJECT, "etap": stage}, headers=auth_header(make_token()))
    assert res.status_code == 201
    assert repo.rows[0]["stage"] == stage


def test_all_four_stages_defined():
    assert {s.value for s in Stage} == {"pomysl", "prototyp", "przetestowane_rozwiazanie", "gotowe_do_wdrozenia"}


@pytest.mark.parametrize("stage", ["wdrozone", "", "POMYSL", None])
def test_publish_rejects_invalid_stage(client, repo, stage):
    res = client.post("/projects", json={**PROJECT, "etap": stage}, headers=auth_header(make_token()))
    assert res.status_code == 422
    assert repo.rows == []


@pytest.mark.parametrize("field", ["tytul", "opis", "innowacyjnosc", "odbiorcy"])
@pytest.mark.parametrize("value", ["", "   "])
def test_publish_rejects_empty_required_fields(client, repo, field, value):
    res = client.post("/projects", json={**PROJECT, field: value}, headers=auth_header(make_token()))
    assert res.status_code == 422
    assert repo.rows == []


@pytest.mark.parametrize("field", ["tytul", "opis", "innowacyjnosc", "odbiorcy", "etap"])
def test_publish_rejects_missing_fields(client, repo, field):
    payload = {k: v for k, v in PROJECT.items() if k != field}
    res = client.post("/projects", json=payload, headers=auth_header(make_token()))
    assert res.status_code == 422


def test_list_and_get_projects(client, repo):
    created = client.post("/projects", json=PROJECT, headers=auth_header(make_token())).json()

    listed = client.get("/projects")
    assert listed.status_code == 200
    assert [p["id"] for p in listed.json()] == [created["id"]]

    fetched = client.get(f"/projects/{created['id']}")
    assert fetched.status_code == 200
    assert fetched.json() == created


def test_get_tolerates_legacy_rows_with_null_new_columns(client, repo):
    legacy_id = str(uuid.uuid4())
    repo.rows.append({
        "id": legacy_id,
        "title": "Stary pomysł",
        "description": None,
        "category": None,
        "user_id": str(uuid.uuid4()),
        "author_name": "Anonim",
        "created_at": "2026-01-01T10:00:00+00:00",
        "innovation": None,
        "target_audience": None,
        "stage": None,
    })
    repo.rows.append({"id": str(uuid.uuid4()), "title": "Bez nowych kolumn", "created_at": "2026-01-02T10:00:00+00:00"})

    res = client.get(f"/projects/{legacy_id}")
    assert res.status_code == 200
    body = res.json()
    assert body["tytul"] == "Stary pomysł"
    assert body["opis"] is None
    assert body["innowacyjnosc"] is None
    assert body["odbiorcy"] is None
    assert body["etap"] is None
    assert body["category"] == "general"

    assert client.get("/projects").status_code == 200


def test_get_unknown_project_returns_404(client):
    res = client.get(f"/projects/{uuid.uuid4()}")
    assert res.status_code == 404


def test_get_invalid_uuid_returns_422(client):
    assert client.get("/projects/not-a-uuid").status_code == 422
