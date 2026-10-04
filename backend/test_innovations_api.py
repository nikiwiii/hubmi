import sys
import io

if __name__ == "__main__" and hasattr(sys.stdout, "buffer"):
    try:
        sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8")
    except Exception:
        pass

from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

print("=== 1. Test GET /api/innovations ===")
res1 = client.get("/api/innovations")
assert res1.status_code == 200, f"Error: {res1.status_code} - {res1.text}"
data1 = res1.json()
print("Status:", res1.status_code)
print("Liczba zwróconych innowacji:", len(data1))
sample = data1[0]
print("Pola innowacji:", list(sample.keys()))
print("Przykładowy rekord:")
print(f"  - ID: {sample.get('id')}")
print(f"  - Tytuł: {sample.get('title')}")
print(f"  - Opis: {sample.get('description', '')[:60]}...")
print(f"  - Problemy: {sample.get('addressed_problems', '')[:60]}...")
print(f"  - Grupa docelowa: {sample.get('target_group')}")
print(f"  - Beneficjenci: {sample.get('beneficiaries')}")
print(f"  - Walidacja: {sample.get('validation')}")
print(f"  - Autorzy: {sample.get('authors')}")
print(f"  - URL: {sample.get('url')}")
print(f"  - Dofinansowanie: {sample.get('funding_info')}")

print("\n=== 2. Test GET /api/innovations/{innovation_id} ===")
item_id = sample["id"]
res2 = client.get(f"/api/innovations/{item_id}")
assert res2.status_code == 200
data2 = res2.json()
print("Status:", res2.status_code)
print(f"Pobrano innowację: {data2.get('title')} (ID: {data2.get('id')})")

print("\n=== 3. Test GET /api/innovations?search=Merkury ===")
res3 = client.get("/api/innovations?search=Merkury")
assert res3.status_code == 200
data3 = res3.json()
print("Znaleziono dla 'Merkury':", len(data3))
for d in data3:
    print(f"  - {d.get('title')}")

print("\n=== 4. Test GET /api/innovations/all (z pełnym embeddingiem) ===")
res4 = client.get("/api/innovations/all")
assert res4.status_code == 200
data4 = res4.json()
print("Status:", res4.status_code)
print("Liczba:", len(data4))
print("Czy zawiera pole embedding:", "embedding" in data4[0])

print("\n=== 5. Test GET /api/matching/innovations ===")
res5 = client.get("/api/matching/innovations")
assert res5.status_code == 200
print("Status:", res5.status_code, "Liczba:", len(res5.json()))

print("\nWSZYSTKIE TESTY ENDPOINTÓW INNOWACJI PRZESZŁY POMYŚLNIE!")
