import json

from app.schemas import MAX_ROUNDS, Stage
from app.routers.assistant import assistant_rate_limiter

DRAFT = {
    "tytul": "Sąsiedzka lodówka",
    "opis": "Lodówka dla sąsiadów",
    "innowacyjnosc": "",
    "odbiorcy": "mieszkańcy",
    "etap": "pomysl",
}

LLM_QUESTION = {
    "question": {"field": "opis", "text": "Gdzie stałaby lodówka i kto by o nią dbał?"},
    "completeness": 40,
}


def history(n: int) -> list[dict]:
    return [{"field": "opis", "question": f"Pytanie {i}?", "answer": f"Odpowiedź {i}", "accepted": True} for i in range(n)]


def refine_payload(field: str = "opis", answer: str = "Stoi w bramie bloku na Kazimierzu", **overrides) -> dict:
    return {
        **DRAFT,
        "question": {"id": "q1", "field": field, "text": "Gdzie stałaby lodówka?"},
        "answer": answer,
        **overrides,
    }


# ---------- /assistant/questions ----------


def test_question_returns_exactly_one(client, llm):
    llm.responses = [LLM_QUESTION]
    res = client.post("/assistant/questions", json=DRAFT)
    assert res.status_code == 200
    assert res.json() == {
        "question": {"id": "q1", "field": "opis", "text": LLM_QUESTION["question"]["text"]},
        "completeness": 40,
        "round": 1,
        "max_rounds": MAX_ROUNDS,
        "done": False,
    }
    assert len(llm.received) == 1


def test_question_round_and_id_follow_history(client, llm):
    llm.responses = [LLM_QUESTION]
    res = client.post("/assistant/questions", json={**DRAFT, "history": history(3)})
    body = res.json()
    assert body["round"] == 4
    assert body["question"]["id"] == "q4"


def test_question_sends_history_to_llm(client, llm):
    llm.responses = [LLM_QUESTION]
    client.post("/assistant/questions", json={**DRAFT, "history": history(2)})
    user_prompt = llm.received[0][1]["content"]
    assert "Pytanie 0?" in user_prompt and "Pytanie 1?" in user_prompt


def test_question_null_means_done(client, llm):
    llm.responses = [{"question": None, "completeness": 95}]
    res = client.post("/assistant/questions", json={**DRAFT, "history": history(2)})
    assert res.status_code == 200
    assert res.json() == {"question": None, "completeness": 95, "round": 2, "max_rounds": MAX_ROUNDS, "done": True}


def test_question_after_max_rounds_is_done_without_llm(client, llm):
    res = client.post("/assistant/questions", json={**DRAFT, "history": history(MAX_ROUNDS)})
    assert res.status_code == 200
    body = res.json()
    assert body["done"] is True
    assert body["question"] is None
    assert body["round"] == MAX_ROUNDS
    assert llm.received == []


def test_question_history_longer_than_max_rejected(client, llm):
    res = client.post("/assistant/questions", json={**DRAFT, "history": history(MAX_ROUNDS + 1)})
    assert res.status_code == 422


def test_question_repeated_question_triggers_retry(client, llm):
    asked = [{"field": "opis", "question": "Gdzie stałaby lodówka i kto by o nią dbał", "answer": "", "accepted": None}]
    other = {"question": {"field": "odbiorcy", "text": "Kto konkretnie będzie korzystał?"}, "completeness": 45}
    llm.responses = [LLM_QUESTION, other]
    res = client.post("/assistant/questions", json={**DRAFT, "history": asked})
    assert res.status_code == 200
    assert res.json()["question"]["field"] == "odbiorcy"
    assert len(llm.received) == 2


def test_question_accepts_code_fenced_json(client, llm):
    llm.responses = ["```json\n" + json.dumps(LLM_QUESTION) + "\n```"]
    assert client.post("/assistant/questions", json=DRAFT).status_code == 200


def test_question_empty_fields_allowed(client, llm):
    llm.responses = [LLM_QUESTION]
    res = client.post("/assistant/questions", json={"tytul": "", "opis": "", "etap": ""})
    assert res.status_code == 200


def test_question_invalid_json_retries_then_succeeds(client, llm):
    llm.responses = ["to nie jest JSON", LLM_QUESTION]
    res = client.post("/assistant/questions", json=DRAFT)
    assert res.status_code == 200
    assert len(llm.received) == 2
    retry_messages = llm.received[1]
    assert retry_messages[-2] == {"role": "assistant", "content": "to nie jest JSON"}
    assert "nie spełnia wymagań" in retry_messages[-1]["content"]


def test_question_invalid_json_twice_returns_502(client, llm):
    llm.responses = ["{zepsuty", {"question": "nie obiekt", "completeness": 10}]
    res = client.post("/assistant/questions", json=DRAFT)
    assert res.status_code == 502
    assert "Asystent AI" in res.json()["detail"]
    assert len(llm.received) == 2


def test_question_schema_violation_triggers_retry(client, llm):
    bad = {"question": {"field": "budzet", "text": "?"}, "completeness": 150}
    llm.responses = [bad, LLM_QUESTION]
    assert client.post("/assistant/questions", json=DRAFT).status_code == 200
    assert len(llm.received) == 2


def test_question_prompt_explains_stages(client, llm):
    llm.responses = [LLM_QUESTION]
    client.post("/assistant/questions", json=DRAFT)
    system_prompt = llm.received[0][0]["content"]
    for stage in Stage:
        assert stage.value in system_prompt


def test_question_does_not_require_auth_and_does_not_touch_repo(client, llm, repo):
    llm.responses = [LLM_QUESTION]
    assert client.post("/assistant/questions", json=DRAFT).status_code == 200
    assert repo.calls == 0


# ---------- /assistant/refine ----------


def test_refine_changes_only_target_field_and_is_stateless(client, llm, repo):
    llm.responses = [{"value": "Lodówka w bramie bloku na Kazimierzu.", "summary": "Dodano lokalizację."}]
    res = client.post("/assistant/refine", json=refine_payload())
    assert res.status_code == 200
    body = res.json()
    assert body["proposal"] == {**DRAFT, "opis": "Lodówka w bramie bloku na Kazimierzu."}
    assert body["changes"] == [{"field": "opis", "summary": "Dodano lokalizację."}]
    assert repo.calls == 0
    assert repo.rows == []


def test_refine_prompt_contains_question_and_answer(client, llm):
    llm.responses = [{"value": "x", "summary": "y"}]
    client.post("/assistant/refine", json=refine_payload())
    user_prompt = llm.received[0][1]["content"]
    assert "Gdzie stałaby lodówka?" in user_prompt
    assert "Stoi w bramie bloku na Kazimierzu" in user_prompt
    assert '"opis"' in user_prompt


def test_refine_unchanged_value_gives_no_changes(client, llm):
    llm.responses = [{"value": DRAFT["opis"], "summary": ""}]
    body = client.post("/assistant/refine", json=refine_payload()).json()
    assert body["proposal"] == DRAFT
    assert body["changes"] == []


def test_refine_blank_value_keeps_current(client, llm):
    llm.responses = [{"value": "  ", "summary": "coś"}]
    body = client.post("/assistant/refine", json=refine_payload()).json()
    assert body["proposal"]["opis"] == DRAFT["opis"]
    assert body["changes"] == []


def test_refine_fills_empty_field(client, llm):
    llm.responses = [{"value": "Prowadzą ją sami mieszkańcy.", "summary": ""}]
    payload = refine_payload(field="innowacyjnosc", answer="Prowadzą ją sami mieszkańcy")
    body = client.post("/assistant/refine", json=payload).json()
    assert body["proposal"]["innowacyjnosc"] == "Prowadzą ją sami mieszkańcy."
    assert body["changes"] == [{"field": "innowacyjnosc", "summary": "Zaktualizowano treść pola."}]


def test_refine_etap_change_when_question_is_about_etap(client, llm):
    llm.responses = [{"value": "prototyp", "summary": "Autor ma już pilotaż."}]
    body = client.post("/assistant/refine", json=refine_payload(field="etap", answer="Mamy już pilotaż")).json()
    assert body["proposal"]["etap"] == "prototyp"
    assert body["changes"][0]["field"] == "etap"


def test_refine_etap_null_keeps_current(client, llm):
    llm.responses = [{"value": None, "summary": ""}]
    body = client.post("/assistant/refine", json=refine_payload(field="etap", answer="nie wiem")).json()
    assert body["proposal"]["etap"] == "pomysl"
    assert body["changes"] == []


def test_refine_invalid_etap_from_llm_retries_then_502(client, llm, repo):
    llm.responses = [{"value": "wdrozone", "summary": ""}, {"value": "wdrozone", "summary": ""}]
    res = client.post("/assistant/refine", json=refine_payload(field="etap", answer="Wdrożyliśmy"))
    assert res.status_code == 502
    assert len(llm.received) == 2
    assert repo.calls == 0


def test_refine_rejects_invalid_input_etap(client, llm):
    res = client.post("/assistant/refine", json=refine_payload(etap="wdrozone"))
    assert res.status_code == 422
    assert llm.received == []


def test_refine_rejects_blank_answer(client, llm):
    res = client.post("/assistant/refine", json=refine_payload(answer="   "))
    assert res.status_code == 422
    assert llm.received == []


def test_refine_requires_question(client, llm):
    payload = refine_payload()
    del payload["question"]
    assert client.post("/assistant/refine", json=payload).status_code == 422


# ---------- rate limit ----------


def test_assistant_rate_limit(client, llm):
    limit = assistant_rate_limiter.max_requests
    llm.responses = [LLM_QUESTION] * (limit + 1)
    statuses = [client.post("/assistant/questions", json=DRAFT).status_code for _ in range(limit + 1)]
    assert statuses[:limit] == [200] * limit
    assert statuses[limit] == 429


def test_full_loop_fits_in_rate_limit():
    assert assistant_rate_limiter.max_requests >= 2 * MAX_ROUNDS


def test_rate_limit_does_not_apply_to_projects(client):
    for _ in range(assistant_rate_limiter.max_requests + 5):
        assert client.get("/projects").status_code == 200
