import io
import uuid
from datetime import datetime, timedelta, timezone

import pytest

from app.schemas import ProjectCreate
from tests.conftest import auth_header, make_token

TEMPLATE_TEXT = (
    "WNIOSEK O DOFINANSOWANIE INNOWACJI SPOŁECZNEJ\n"
    "Część A. Dane wnioskodawcy\n1. Imię i nazwisko *\n"
    "Część B. Opis projektu\n2. Opis problemu (max. 300 znaków) *\n3. Budżet projektu\n"
)

LLM_FIELDS = {
    "fields": [
        {"label": "Imię i nazwisko", "section": "Dane wnioskodawcy", "type": "short_text", "required": True},
        {"label": "Opis problemu", "section": "Opis projektu", "required": True, "max_chars": 300},
        {"label": "Budżet projektu", "section": "Opis projektu", "type": "number"},
    ]
}


def make_pdf(text: str = TEMPLATE_TEXT) -> bytes:
    from fpdf import FPDF

    from app.services.documents import FONTS_DIR

    pdf = FPDF()
    pdf.add_font("DejaVu", "", str(FONTS_DIR / "DejaVuSans.ttf"))
    pdf.add_page()
    pdf.set_font("DejaVu", size=11)
    pdf.multi_cell(0, 6, text)
    return bytes(pdf.output())


ADMIN = auth_header(make_token(role="admin", name="Admin ROPS"))
USER_ID = str(uuid.uuid4())
USER = auth_header(make_token(sub=USER_ID, name="Anna Nowak"))
OTHER = auth_header(make_token(name="Ktoś Inny"))


def _iso(delta_days: float) -> str:
    return (datetime.now(timezone.utc) + timedelta(days=delta_days)).isoformat()


def create_call(client, llm, fields=LLM_FIELDS, pdf=None):
    llm.responses.append(fields)
    res = client.post(
        "/calls",
        data={"title": "Nabór 2026", "starts_at": _iso(-1), "ends_at": _iso(7), "description": "Granty na innowacje"},
        files={"template": ("wzor.pdf", io.BytesIO(pdf or make_pdf()), "application/pdf")},
        headers=ADMIN,
    )
    assert res.status_code == 201, res.text
    return res.json()


def open_call(client, llm):
    call = create_call(client, llm)
    res = client.patch(f"/calls/{call['id']}", json={"status": "published"}, headers=ADMIN)
    assert res.status_code == 200, res.text
    return res.json()


def make_idea(repo, user_id=USER_ID):
    return repo.create(
        ProjectCreate(
            tytul="Sąsiedzka spiżarnia",
            opis="Lodówki społeczne w blokach dla seniorów.",
            innowacyjnosc="Wymiana jedzenia między sąsiadami.",
            odbiorcy="Seniorzy",
            etap="prototyp",
        ),
        user_id=user_id,
        author_name="Anna Nowak",
    )


def start_application(client, llm, repo, answers=None):
    call = open_call(client, llm)
    idea = make_idea(repo)
    llm.responses.append({"answers": answers or {"imie_i_nazwisko": "Anna Nowak", "opis_problemu": "Seniorzy marnują jedzenie.", "budzet_projektu": ""}})
    res = client.post("/applications", json={"call_id": call["id"], "idea_id": idea.id}, headers=USER)
    assert res.status_code == 201, res.text
    return call, idea, res.json()


# ---------- calls ----------


def test_create_call_extracts_fields_from_pdf(client, llm, template_storage):
    call = create_call(client, llm)

    assert call["status"] == "draft" and call["is_open"] is False
    assert [f["id"] for f in call["fields"]] == ["imie_i_nazwisko", "opis_problemu", "budzet_projektu"]
    assert call["fields"][1]["max_chars"] == 300
    assert call["template_url"].endswith(".pdf") and len(template_storage.uploads) == 1
    assert call["extraction_error"] is None
    assert "Opis problemu" in llm.received[0][1]["content"]


def test_duplicate_labels_get_unique_ids(client, llm):
    call = create_call(client, llm, fields={"fields": [{"label": "Opis"}, {"label": "Opis"}]})
    assert [f["id"] for f in call["fields"]] == ["opis", "opis_2"]


def test_scanned_pdf_creates_call_with_error(client, llm):
    from fpdf import FPDF

    pdf = FPDF()
    pdf.add_page()
    call = create_call(client, llm, pdf=bytes(pdf.output()))
    llm.responses.clear()

    assert call["fields"] == [] and "skanem" in call["extraction_error"]
    res = client.patch(f"/calls/{call['id']}", json={"status": "published"}, headers=ADMIN)
    assert res.status_code == 422


def test_non_pdf_rejected(client):
    res = client.post(
        "/calls",
        data={"title": "X", "starts_at": _iso(0), "ends_at": _iso(1)},
        files={"template": ("a.pdf", io.BytesIO(b"hello"), "application/pdf")},
        headers=ADMIN,
    )
    assert res.status_code == 422


def test_calls_admin_only(client):
    assert client.get("/calls", headers=USER).status_code == 403
    assert client.post("/calls", headers=USER, data={}).status_code in (403, 422)


def test_open_calls_lists_only_published_in_window(client, llm):
    draft = create_call(client, llm)
    published = open_call(client, llm)
    open_ids = [c["id"] for c in client.get("/calls/open").json()]
    assert open_ids == [published["id"]] and draft["id"] not in open_ids

    client.patch(f"/calls/{published['id']}", json={"status": "closed"}, headers=ADMIN)
    assert client.get("/calls/open").json() == []


def test_fields_locked_after_publish(client, llm):
    call = open_call(client, llm)
    res = client.patch(f"/calls/{call['id']}", json={"fields": []}, headers=ADMIN)
    assert res.status_code == 409


def test_admin_edits_fields_in_draft(client, llm):
    call = create_call(client, llm)
    fields = call["fields"][:1] + [{"id": "harmonogram", "label": "Harmonogram", "required": True}]
    res = client.patch(f"/calls/{call['id']}", json={"fields": fields}, headers=ADMIN)
    assert res.status_code == 200
    assert [f["id"] for f in res.json()["fields"]] == ["imie_i_nazwisko", "harmonogram"]

    dup = client.patch(f"/calls/{call['id']}", json={"fields": fields + fields[-1:]}, headers=ADMIN)
    assert dup.status_code == 422


# ---------- applications ----------


def test_prefill_leaves_missing_fields_empty(client, llm, repo):
    call, idea, application = start_application(client, llm, repo)

    assert application["status"] == "draft"
    assert application["answers"] == {"imie_i_nazwisko": "Anna Nowak", "opis_problemu": "Seniorzy marnują jedzenie."}
    assert application["ai_filled"] == ["imie_i_nazwisko", "opis_problemu"]
    assert application["call"]["id"] == call["id"]
    assert "Sąsiedzka spiżarnia" in llm.received[-1][1]["content"]


def test_prefill_retries_when_answer_too_long(client, llm, repo):
    call = open_call(client, llm)
    idea = make_idea(repo)
    llm.responses.extend([{"answers": {"opis_problemu": "x" * 301}}, {"answers": {"opis_problemu": "krótko"}}])
    res = client.post("/applications", json={"call_id": call["id"], "idea_id": idea.id}, headers=USER)
    assert res.status_code == 201
    assert res.json()["answers"] == {"opis_problemu": "krótko"}


def test_second_create_returns_existing(client, llm, repo):
    call, idea, application = start_application(client, llm, repo)
    res = client.post("/applications", json={"call_id": call["id"], "idea_id": idea.id}, headers=USER)
    assert res.status_code == 200 and res.json()["id"] == application["id"]


def test_cannot_apply_with_someone_elses_idea(client, llm, repo):
    call = open_call(client, llm)
    idea = make_idea(repo, user_id=str(uuid.uuid4()))
    res = client.post("/applications", json={"call_id": call["id"], "idea_id": idea.id}, headers=USER)
    assert res.status_code == 403


def test_cannot_apply_to_closed_call(client, llm, repo):
    call = open_call(client, llm)
    client.patch(f"/calls/{call['id']}", json={"status": "closed"}, headers=ADMIN)
    idea = make_idea(repo)
    res = client.post("/applications", json={"call_id": call["id"], "idea_id": idea.id}, headers=USER)
    assert res.status_code == 409


def test_edit_clears_ai_flag_and_drops_unknown_fields(client, llm, repo):
    _, _, application = start_application(client, llm, repo)
    answers = {**application["answers"], "opis_problemu": "Mój własny opis.", "nieznane": "x"}
    res = client.patch(f"/applications/{application['id']}", json={"answers": answers}, headers=USER)

    assert res.status_code == 200
    body = res.json()
    assert "nieznane" not in body["answers"]
    assert body["ai_filled"] == ["imie_i_nazwisko"]


def test_other_user_cannot_see_application(client, llm, repo):
    _, _, application = start_application(client, llm, repo)
    assert client.get(f"/applications/{application['id']}", headers=OTHER).status_code == 404
    assert client.get(f"/applications/{application['id']}", headers=ADMIN).status_code == 200


def test_submit_validates_required_and_limits(client, llm, repo):
    _, _, application = start_application(client, llm, repo, answers={"opis_problemu": "Problem"})
    res = client.post(f"/applications/{application['id']}/submit", headers=USER)
    assert res.status_code == 422 and "Imię i nazwisko" in res.json()["detail"]


def test_full_flow_submit_review_pdf(client, llm, repo):
    call, _, application = start_application(client, llm, repo)
    app_id = application["id"]

    assert client.get(f"/calls/{call['id']}/applications", headers=ADMIN).json() == []

    submitted = client.post(f"/applications/{app_id}/submit", headers=USER)
    assert submitted.status_code == 200 and submitted.json()["status"] == "submitted"
    assert client.patch(f"/applications/{app_id}", json={"answers": {}}, headers=USER).status_code == 409

    listed = client.get(f"/calls/{call['id']}/applications", headers=ADMIN).json()
    assert [a["id"] for a in listed] == [app_id]
    assert client.get("/calls", headers=ADMIN).json()[0]["applications_count"] == 1

    assert client.patch(f"/applications/{app_id}/status", json={"status": "accepted"}, headers=USER).status_code == 403
    reviewed = client.patch(
        f"/applications/{app_id}/status", json={"status": "under_review", "admin_comment": "Ocena do 15.10"}, headers=ADMIN
    )
    assert reviewed.json()["status"] == "under_review" and reviewed.json()["admin_comment"] == "Ocena do 15.10"

    pdf = client.get(f"/applications/{app_id}/pdf", headers=USER)
    assert pdf.status_code == 200 and pdf.headers["content-type"] == "application/pdf"
    assert pdf.content.startswith(b"%PDF-")

    mine = client.get("/applications/mine", headers=USER).json()
    assert mine[0]["id"] == app_id and mine[0]["call"]["title"] == "Nabór 2026"


def test_pdf_is_the_filled_template():
    import pymupdf

    from app.schemas import ApplicationOut, CallField, CallOut
    from app.services.documents import fill_template_pdf

    template = make_pdf(
        "WNIOSEK O DOFINANSOWANIE INNOWACJI SPOŁECZNEJ\n\n"
        "1. Imię i nazwisko*: ................................\n"
        "2. Adres e-mail: ....................................\n\n"
        "3. Opis problemu społecznego*\n"
        "................................................................................\n"
        "................................................................................\n"
        "................................................................................\n\n"
        "4. Wnioskowana kwota (PLN)*: ........................\n"
    )
    call = CallOut(
        id="c", title="Nabór", starts_at="2026-01-01T00:00:00Z", ends_at="2027-01-01T00:00:00Z", status="published",
        fields=[
            CallField(id="imie", label="Imię i nazwisko", required=True),
            CallField(id="email", label="Adres e-mail"),
            CallField(id="opis", label="Opis problemu społecznego", required=True),
            CallField(id="kwota", label="Wnioskowana kwota (PLN)", type="number", required=True),
        ],
    )
    application = ApplicationOut(
        id="a", call_id="c", user_id="u", status="submitted",
        answers={
            "imie": "Anna Nowak",
            "opis": "Seniorzy w blokach na osiedlu marnują żywność, a jednocześnie brakuje im posiłków.",
            "kwota": "5000",
        },
    )

    filled = fill_template_pdf(template, call, application)
    assert filled is not None
    doc = pymupdf.open(stream=filled, filetype="pdf")
    text = doc[0].get_text()
    assert "WNIOSEK O DOFINANSOWANIE" in text
    assert "Anna Nowak" in text and "5000" in text
    assert "marnują żywność" in text
    assert doc.page_count == 1  # everything fit, so no extra page
    assert "Adres e-mail" in text  # empty field stays a blank of the template


def test_field_assistant_question_then_draft(client, llm, repo):
    _, _, application = start_application(client, llm, repo)
    url = f"/applications/{application['id']}/assist"

    llm.responses.append({"question": "Jaką kwotę planujesz wydać na lodówki?"})
    q = client.post(f"{url}/question", json={"field_id": "budzet_projektu"}, headers=USER)
    assert q.json() == {"question": "Jaką kwotę planujesz wydać na lodówki?", "done": False}

    llm.responses.append({"value": "5000"})
    history = [{"question": q.json()["question"], "answer": "Około 5000 zł"}]
    d = client.post(f"{url}/draft", json={"field_id": "budzet_projektu", "history": history}, headers=USER)
    assert d.status_code == 200 and d.json() == {"value": "5000"}
    assert "Około 5000 zł" in llm.received[-1][1]["content"]


@pytest.mark.parametrize("field_id", ["nie_ma_takiego"])
def test_field_assistant_unknown_field(client, llm, repo, field_id):
    _, _, application = start_application(client, llm, repo)
    res = client.post(f"/applications/{application['id']}/assist/question", json={"field_id": field_id}, headers=USER)
    assert res.status_code == 422
