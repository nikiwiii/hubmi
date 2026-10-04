import sys
import io

# Wymuszenie kodowania UTF-8 dla Windows cmd/powershell
if sys.platform.startswith("win") and hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

print("=== TEST 1: Wyszukiwanie innowacji z domem starców i dofinansowaniem ===")
res1 = client.post("/api/matching/chat", json={
    "message": "szukam rozwiazan zwiazanych z domem starcow dla jakis tam osob i dofinansowaniem"
})
assert res1.status_code == 200, f"Error: {res1.text}"
data1 = res1.json()
print("Status Guardrail:", data1["guardrail_status"])
print("Top Solution:", data1["top_solution"]["title"], "| Podobieństwo:", data1["top_solution"]["similarity_percentage"])
print("Dokument źródłowy:", data1["explainability"]["source_file"])
print("Adres URL:", data1["explainability"]["source_url"])
print("Liczba zbliżonych rozwiązań (w granicy 5%):", len(data1["close_solutions"]))
for c in data1["close_solutions"]:
    print(f"  - Alternatywa: {c['title']} | Podobieństwo: {c['similarity_percentage']}")
print("Trace kroków:", len(data1["trace"]))
for t in data1["trace"]:
    print(f"  [{t['name']}] ({t['duration_ms']} ms) -> {t['status']}")

print("\n--- Przykładowa odpowiedź chatbota ---")
print(data1["answer"])

print("\n=== TEST 2: Railway / Guardrail - Pytanie niezwiązane (off-topic) ===")
res2 = client.post("/api/matching/chat", json={
    "message": "podaj mi przepis na smaczne ciasto z jablkami"
})
data2 = res2.json()
print("Status Guardrail:", data2["guardrail_status"])
print("Odpowiedź:", data2["answer"])
assert data2["guardrail_status"] == "BLOCKED_OFF_TOPIC"

print("\n=== TEST 3: Railway / Guardrail - Brak projektu w bazie ===")
res3 = client.post("/api/matching/chat", json={
    "message": "jak zbudowac stacje kosmiczna na ksiezycu dla astronautow z paliwem rakietowym"
})
data3 = res3.json()
print("Status Guardrail:", data3["guardrail_status"])
print("Odpowiedź:", data3["answer"])
assert data3["guardrail_status"] == "BLOCKED_NOT_FOUND"

print("\nWSZYSTKIE TESTY MATCHING RAG I GUARDRAILS PRZESZŁY POMYŚLNIE!")
