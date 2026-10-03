import base64

from app.routers.visualize import image_rate_limiter

DRAFT = {
    "tytul": "Sąsiedzka lodówka",
    "opis": "Lodówka w bramie bloku, do której sąsiedzi oddają nadmiar jedzenia.",
    "innowacyjnosc": "",
    "odbiorcy": "mieszkańcy osiedla",
    "etap": "pomysl",
    "category": "Społeczność & Życie",
}

IMAGE_PROMPT = (
    "A shared community fridge in the entrance of an apartment block, neighbours placing food inside, "
    "soft modern editorial illustration, no text, no letters, no logos, no watermark"
)


def test_generate_image_returns_data_url_and_prompt(client, llm, images):
    llm.responses = [{"prompt": IMAGE_PROMPT}]
    res = client.post("/generate_image", json=DRAFT)
    assert res.status_code == 200
    body = res.json()
    assert body["prompt"] == IMAGE_PROMPT
    assert body["model"] == "test-image-model"
    assert body["image"] == "data:image/png;base64," + base64.b64encode(b"\x89PNG-fake").decode()
    assert images.prompts == [IMAGE_PROMPT]


def test_generate_image_sends_fields_and_category_to_llm(client, llm):
    llm.responses = [{"prompt": IMAGE_PROMPT}]
    client.post("/generate_image", json=DRAFT)
    user_prompt = llm.received[0][1]["content"]
    assert "Sąsiedzka lodówka" in user_prompt
    assert "Społeczność & Życie" in user_prompt


def test_generate_image_retries_invalid_llm_output(client, llm, images):
    llm.responses = ["not json", {"prompt": IMAGE_PROMPT}]
    res = client.post("/generate_image", json=DRAFT)
    assert res.status_code == 200
    assert len(llm.received) == 2
    assert len(images.prompts) == 1


def test_generate_image_requires_title_or_description(client, llm, images):
    res = client.post("/generate_image", json={"tytul": " ", "opis": ""})
    assert res.status_code == 422
    assert llm.received == []
    assert images.prompts == []


def test_generate_image_provider_failure_is_502(client, llm, images):
    llm.responses = [{"prompt": IMAGE_PROMPT}]
    images.fail = True
    res = client.post("/generate_image", json=DRAFT)
    assert res.status_code == 502


def test_generate_image_insufficient_balance_explains_cause(client, llm, images):
    llm.responses = [{"prompt": IMAGE_PROMPT}]
    images.fail = True
    images.fail_status = 402
    res = client.post("/generate_image", json=DRAFT)
    assert res.status_code == 502
    assert "Brak środków" in res.json()["detail"]
    assert "POLLINATIONS_IMAGE_MODEL" in res.json()["detail"]


def test_generate_image_is_rate_limited(client, llm):
    limit = image_rate_limiter.max_requests
    llm.responses = [{"prompt": IMAGE_PROMPT}] * limit
    for _ in range(limit):
        assert client.post("/generate_image", json=DRAFT).status_code == 200
    assert client.post("/generate_image", json=DRAFT).status_code == 429
