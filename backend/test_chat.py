import sys
import io

# Wymuszenie kodowania UTF-8 dla Windows console
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8")

from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

print("=== 1. Logowanie użytkownika i administratora (Eksperta) ===")
user_login = client.post("/api/login/user", json={
    "email": "user@hubmi.com",
    "password": "user123"
})
assert user_login.status_code == 200, f"User login failed: {user_login.text}"
user_token = user_login.json()["access_token"]
user_headers = {"Authorization": f"Bearer {user_token}"}
print("Zalogowano użytkownika:", user_login.json()["user"]["full_name"])

admin_login = client.post("/api/login/admin", json={
    "email": "admin@hubmi.com",
    "password": "admin123"
})
assert admin_login.status_code == 200, f"Admin login failed: {admin_login.text}"
admin_token = admin_login.json()["access_token"]
admin_headers = {"Authorization": f"Bearer {admin_token}"}
print("Zalogowano eksperta/admina:", admin_login.json()["user"]["full_name"])

print("\n=== 2. Użytkownik klika 'Napisz do eksperta' pod postem ===")
start_conv = client.post("/api/chat/conversations", json={
    "idea_id": "idea-1234-test",
    "idea_title": "Ośrodek Integracji Senioralnej w Krakowie",
    "topic": "Pytanie o dotację z programu ROPS Kraków",
    "initial_message": "Dzień dobry, czy nasz projekt kwalifikuje się do dofinansowania z regionalnego programu senioralnego?"
}, headers=user_headers)
assert start_conv.status_code == 201, f"Start conv failed: {start_conv.text}"
conv_data = start_conv.json()
conv_id = conv_data["id"]
print("Otwarto wątek czatu ID:", conv_id)
print("Temat:", conv_data["topic"])
print("Status:", conv_data["status"])

print("\n=== 3. Ekspert/Admin przegląda listę czatów na swoim dashboardzie ===")
admin_list = client.get("/api/chat/conversations", headers=admin_headers)
assert admin_list.status_code == 200
convs = admin_list.json()
print(f"Liczba wątków w panelu eksperta: {len(convs)}")
target_conv = next((c for c in convs if c["id"] == conv_id), None)
assert target_conv is not None, "Admin powinien widzieć otwarty wątek użytkownika!"
print("Znaleziono zgłoszenie użytkownika:", target_conv["user_name"], "| Nieprzeczytane:", target_conv["unread_by_admin"])

print("\n=== 4. Ekspert klika w ten czat i odpowiada użytkownikowi ===")
expert_reply = client.post(f"/api/chat/conversations/{conv_id}/messages", json={
    "content": "Dzień dobry! Tak, projekt wpisuje się w cele ROPS Kraków. Nabór wniosków trwa do końca miesiąca. Czy posiadają już Państwo partnera samorządowego?"
}, headers=admin_headers)
assert expert_reply.status_code == 201, f"Expert reply failed: {expert_reply.text}"
msg_data = expert_reply.json()
print(f"Ekspert ({msg_data['sender_name']}) odpisał: {msg_data['content'][:80]}...")

print("\n=== 5. Użytkownik wykonuje POLLING (co 3 sekundy) i odbiera odpowiedź ===")
poll_res = client.get(f"/api/chat/conversations/{conv_id}/messages", headers=user_headers)
assert poll_res.status_code == 200
poll_data = poll_res.json()
print("Odebrano wiadomości:", len(poll_data["messages"]))
for m in poll_data["messages"]:
    print(f"  [{m['sender_role'].upper()} - {m['sender_name']}]: {m['content']}")

last_msg_timestamp = poll_data["last_polled_at"]

print("\n=== 6. Użytkownik odpisuje na czacie ===")
user_reply = client.post(f"/api/chat/conversations/{conv_id}/messages", json={
    "content": "Tak, współpracujemy z MOPS Kraków oraz dwiema fundacjami."
}, headers=user_headers)
assert user_reply.status_code == 201
print("Użytkownik wysłał kolejną wiadomość.")

print("\n=== 7. Ekspert wykonuje POLLING z parametrem `since` (tylko nowe wiadomości) ===")
poll_since = client.get(
    f"/api/chat/conversations/{conv_id}/messages?since={last_msg_timestamp}",
    headers=admin_headers
)
assert poll_since.status_code == 200
since_data = poll_since.json()
print("Nowe wiadomości odebrane w kolejnym cyklu 3s:", len(since_data["messages"]))
assert len(since_data["messages"]) == 1, "Powinna nadejść dokładnie 1 nowa wiadomość od usera!"
print("Treść nowej wiadomości:", since_data["messages"][0]["content"])

print("\n=== 8. Ekspert aktualizuje status rozmowy na 'closed' ===")
close_res = client.patch(
    f"/api/chat/conversations/{conv_id}/status",
    json={"status": "closed"},
    headers=admin_headers
)
assert close_res.status_code == 200
print("Status zaktualizowany na:", close_res.json()["status"])

print("\nWSZYSTKIE TESTY KOMUNIKATORA EKSPERTÓW ROPS KRAKÓW I POLLINGU CO 3S PRZESZŁY POMYŚLNIE!")
