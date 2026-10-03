import json

import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient

from middleman import service
from middleman.router import router
from middleman.service import LLMUnavailableError, get_llm

INNOVATION = {
    "id": "inn-1",
    "title": "Sąsiedzka sieć wsparcia seniorów",
    "description": "Wolontariusze odwiedzają samotnych seniorów i pomagają w codziennych sprawach.",
    "addressed_problems": "Samotność i wykluczenie seniorów",
    "target_group": "Seniorzy 65+",
    "funding_info": "Budżet gminy, środki z programów regionalnych",
    "url": "https://example.org/inn-1",
}

PROFILE = {
    "institution_type": "gmina_wiejska",
    "institution_name": "Gmina Dobra",
    "powiat": "Powiat limanowski",
    "target_group": "Samotni seniorzy",
    "recipients_count": 40,
    "budget_range": "20k_100k",
    "staff_resources": "1 pracownik socjalny na pół etatu",
    "time_horizon_months": 6,
    "local_context": "Słaby transport publiczny",
}


def make_card(amounts=(10_000, 5_000)) -> dict:
    return {
        "service_name": "Sąsiedzkie wsparcie seniorów w Gminie Dobra",
        "summary": "Wolontariusze z sołectw odwiedzają samotnych seniorów. Pomagają w zakupach i drobnych sprawach.",
        "adaptations": [{"change": "Mniejsza skala – 2 sołectwa", "reason": "Pół etatu kadry"}],
        "scope": ["Wizyty domowe raz w tygodniu"],
        "recipients": "Około 40 samotnych seniorów",
        "resources": {"staff": ["Koordynator"], "premises": [], "equipment": [], "local_partners": ["KGW"]},
        "timeline": [{"name": "Pilotaż", "duration": "miesiące 1–3", "activities": ["Rekrutacja wolontariuszy"]}],
        "budget": {"items": [{"name": f"Pozycja {i}", "amount_pln": a} for i, a in enumerate(amounts)], "total_pln": 1},
        "funding_sources": [{"source": "Budżet gminy", "how_to_use": "Zaplanuj w budżecie"}],
        "kpis": [{"name": "Liczba seniorów", "target": "40", "measurement": "Lista obecności"}],
        "risks": [{"risk": "Brak wolontariuszy", "mitigation": "Współpraca z KGW"}],
        "next_steps": ["Skonsultuj z ekspertem ROPS"],
    }


class FakeLLM:
    def __init__(self, responses):
        self.responses = list(responses)
        self.calls: list[list[dict]] = []

    async def chat_json(self, messages):
        self.calls.append(list(messages))
        item = self.responses.pop(0)
        if isinstance(item, Exception):
            raise item
        return item


@pytest.fixture
def setup(monkeypatch):
    app = FastAPI()
    app.include_router(router)
    db = {INNOVATION["id"]: INNOVATION}
    monkeypatch.setattr(service.DatabaseRepository, "get_innovation_by_id", staticmethod(lambda i: db.get(i)))

    def with_llm(*responses):
        llm = FakeLLM(responses)
        app.dependency_overrides[get_llm] = lambda: llm
        return TestClient(app), llm

    return with_llm


def test_adapt_returns_card_with_computed_total(setup):
    client, llm = setup(json.dumps(make_card()))
    res = client.post("/api/middleman/adapt", json={"innovation_id": "inn-1", "profile": PROFILE})
    assert res.status_code == 200
    body = res.json()
    assert body["innovation_title"] == INNOVATION["title"]
    assert body["card"]["budget"]["total_pln"] == 15_000
    assert "szacunkiem" in body["card"]["budget"]["disclaimer"]
    prompt = llm.calls[0][1]["content"]
    assert "Budżet gminy, środki z programów regionalnych" in prompt
    assert "Gmina wiejska" in prompt


def test_adapt_unknown_innovation_404(setup):
    client, _ = setup()
    res = client.post("/api/middleman/adapt", json={"innovation_id": "missing", "profile": PROFILE})
    assert res.status_code == 404


def test_adapt_retries_on_invalid_json(setup):
    client, llm = setup("to nie jest JSON", "```json\n" + json.dumps(make_card()) + "\n```")
    res = client.post("/api/middleman/adapt", json={"innovation_id": "inn-1", "profile": PROFILE})
    assert res.status_code == 200
    assert len(llm.calls) == 2
    assert "nie spełnia wymagań" in llm.calls[1][-1]["content"]


def test_adapt_502_after_two_invalid_responses(setup):
    client, _ = setup("{}", "{}")
    res = client.post("/api/middleman/adapt", json={"innovation_id": "inn-1", "profile": PROFILE})
    assert res.status_code == 502


def test_adapt_retries_when_over_budget_then_accepts(setup):
    over = json.dumps(make_card(amounts=(90_000, 30_000)))
    client, llm = setup(over, json.dumps(make_card()))
    res = client.post("/api/middleman/adapt", json={"innovation_id": "inn-1", "profile": PROFILE})
    assert res.status_code == 200
    assert res.json()["card"]["budget"]["total_pln"] == 15_000
    retry_msg = llm.calls[1][-1]["content"]
    assert "przekracza" in retry_msg
    assert "nie obniżaj stawek" in retry_msg


def test_adapt_accepts_over_budget_card_with_feasibility_note(setup):
    card = make_card(amounts=(90_000, 30_000))
    card["feasibility_note"] = "W tym budżecie będzie trudno – brakuje ok. 20 tys. zł."
    client, llm = setup(json.dumps(card))
    res = client.post("/api/middleman/adapt", json={"innovation_id": "inn-1", "profile": PROFILE})
    assert res.status_code == 200
    assert len(llm.calls) == 1
    assert res.json()["card"]["feasibility_note"] == card["feasibility_note"]


def test_adapt_returns_over_budget_card_with_default_note_if_retry_still_over(setup):
    over = json.dumps(make_card(amounts=(90_000, 30_000)))
    client, _ = setup(over, over)
    res = client.post("/api/middleman/adapt", json={"innovation_id": "inn-1", "profile": PROFILE})
    assert res.status_code == 200
    card = res.json()["card"]
    assert card["budget"]["total_pln"] == 120_000
    assert "przekraczają dostępny budżet" in card["feasibility_note"]


def test_within_budget_card_has_no_feasibility_note(setup):
    client, _ = setup(json.dumps(make_card()))
    res = client.post("/api/middleman/adapt", json={"innovation_id": "inn-1", "profile": PROFILE})
    assert res.json()["card"]["feasibility_note"] is None


def test_prompt_marks_staff_as_existing_employees(setup):
    client, llm = setup(json.dumps(make_card()))
    client.post("/api/middleman/adapt", json={"innovation_id": "inn-1", "profile": PROFILE})
    system, user = llm.calls[0][0]["content"], llm.calls[0][1]["content"]
    assert '"obecna_kadra_instytucji": "1 pracownik socjalny na pół etatu"' in user
    assert "NIE wpisuj ich wynagrodzeń do budżetu" in system


def test_adapt_llm_unavailable_502(setup):
    client, _ = setup(LLMUnavailableError("APIConnectionError"))
    res = client.post("/api/middleman/adapt", json={"innovation_id": "inn-1", "profile": PROFILE})
    assert res.status_code == 502


def test_adapt_rejects_invalid_profile(setup):
    client, _ = setup()
    bad = {**PROFILE, "time_horizon_months": 9}
    res = client.post("/api/middleman/adapt", json={"innovation_id": "inn-1", "profile": bad})
    assert res.status_code == 422


def test_refine_sends_previous_card_and_instruction(setup):
    refined = make_card(amounts=(4_000,))
    client, llm = setup(json.dumps(refined))
    res = client.post(
        "/api/middleman/refine",
        json={
            "innovation_id": "inn-1",
            "profile": PROFILE,
            "card": make_card(),
            "instruction": "Mamy mniejszy budżet",
        },
    )
    assert res.status_code == 200
    assert res.json()["card"]["budget"]["total_pln"] == 4_000
    prompt = llm.calls[0][1]["content"]
    assert "Mamy mniejszy budżet" in prompt
    assert "Sąsiedzkie wsparcie seniorów w Gminie Dobra" in prompt


def test_get_llm_without_key_returns_503(monkeypatch):
    monkeypatch.setattr(service, "GROQ_API_KEY", "")
    app = FastAPI()
    app.include_router(router)
    res = TestClient(app).post("/api/middleman/adapt", json={"innovation_id": "inn-1", "profile": PROFILE})
    assert res.status_code == 503
