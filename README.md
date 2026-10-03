# Hubmi - FastAPI + Supabase + RAG Matching (Groq API)

Platforma społecznościowa z backendem w FastAPI, bazą Supabase oraz inteligentnym modułem **Matching RAG z Groq API**, który wyszukuje innowacje na podstawie problemu użytkownika, wskazuje dofinansowanie, źródła oraz generuje wyjaśnienia i ślad wykonania (tracing).

---

## 📁 Struktura Backend (`backend/`)

```text
backend/
├── login/                     # 1) & 2) & 3) Uwierzytelnianie i profile
│   ├── schemas.py             # Modele Pydantic (User, Admin, Register, Profile)
│   ├── service.py             # Logika autoryzacji, hashowanie (bcrypt), tokeny JWT
│   └── router.py              # Endpointy: /api/login/user, /register, /admin, /me
├── ideas/                     # 4) Posty i reakcje
│   ├── schemas.py             # Modele Pydantic (IdeaCreate, ReactionRequest)
│   ├── service.py             # Logika postów, usuwanie (autor/admin), liczniki
│   └── router.py              # Endpointy: /api/ideas/ (CRUD, like, volunteer, dislike)
├── matching/                  # 🤖 RAG Matching & Chatbot (Groq API + vector search)
│   ├── embeddings.py          # Generowanie wektorów (2880 dim / all-MiniLM), cosine similarity
│   ├── schemas.py             # Modele Pydantic (MatchRequest, MatchResponse, TraceStep, Explainability)
│   ├── service.py             # Wyszukiwanie wektorowe, filtr 5%, Railway/Guardrails, Groq API
│   └── router.py              # Endpointy: /api/matching/chat, /match, /innovations
├── chat/                      # 💬 NOWY MODUŁ: Komunikator Ekspert ROPS Kraków <-> Użytkownicy
│   ├── schemas.py             # Modele Pydantic (ConversationCreate, MessageCreate, PollMessagesResponse)
│   ├── service.py             # Obsługa wątków, przypisywanie ekspertów, polling co 3 sekundy
│   └── router.py              # Endpointy: /api/chat/conversations, /messages, /status
├── config.py                  # Konfiguracja środowiska, JWT, Groq API, progi dopasowania
├── supabase_client.py         # Klient Supabase z obsługą tabel i local-fallback
├── supabase_schema.sql        # Skrypt SQL dla Supabase (profiles, ideas, innovations, chat)
├── main.py                    # Główny serwer FastAPI + CORS + Docs
├── requirements.txt           # Zależności Pythona
└── .env                       # Zmienne środowiskowe (SUPABASE_URL, GROQ_API_KEY)
```

---

## 🚀 Endpointy Backendowe

### 1. Moduł `backend/matching` (RAG Chatbot & Innowacje)
- **`POST /api/matching/chat`** (oraz alias `/api/matching/match`):
  - **Wejście:** `{"message": "szukam rozwiazan zwiazanych z domem starcow dla jakis tam osob i dofinansowaniem"}`
  - **Vector Search:** Wyszukiwanie po embeddingach problemów w tabeli `innovations`.
  - **Najlepsze rozwiązanie:** Zwraca najbardziej pasujący projekt wraz z opisem i opcjami dofinansowania.
  - **Reguła 5%:** Jeśli w bazie znajdują się do 2 innych rozwiązań z podobieństwem różniącym się maksymalnie o 5% od najlepszego, są one dołączane jako alternatywy.
  - **Explainability:** Wskazuje, dlaczego wybrano dane rozwiązanie, jakie słowa kluczowe i kryteria zadecydowały.
  - **Źródło & URL:** Wskazuje nazwę pliku źródłowego (`file_source`) oraz bezpośredni odnośnik (`url`) do wejścia i wglądu.
  - **Railway / Guardrails:**
    - Jeśli pytanie jest niezwiązane (np. przepisy kulinarne, dowcipy) ➔ blokada ze statusem `BLOCKED_OFF_TOPIC`.
    - Jeśli w bazie nie ma pasującego projektu ➔ odpowiedź odmowna ze statusem `BLOCKED_NOT_FOUND`.
  - **Groq API:** Generuje naturalną, ustrukturyzowaną odpowiedź chatbota w języku polskim.
  - **Tracing:** Zwraca pełny ślad telemetryczny krok po kroku z czasami trwania w milisekundach.
- **`GET /api/matching/innovations`**: Pobranie listy innowacji w bazie wraz z linkami URL i plikami.
- **`POST /api/matching/innovations`**: Dodanie nowej innowacji do bazy danych.

### 2. Moduł `backend/login`
- **`POST /api/login/user`** – Logowanie zwykłego użytkownika.
- **`POST /api/login/register`** – Tworzenie nowego profilu (rejestracja).
- **`POST /api/login/admin`** – Logowanie jako administrator.
- **`GET /api/login/me`** – Dane zalogowanego użytkownika.

### 3. Moduł `backend/ideas`
- **`GET /api/ideas/`** – Lista postów z licznikami reakcji.
- **`POST /api/ideas/`** – Tworzenie posta.
- **`DELETE /api/ideas/{id}`** – Usuwanie posta (autor lub admin).
- **`POST /api/ideas/{id}/like`** – Polubienie.
- **`POST /api/ideas/{id}/volunteer`** – Zgłoszenie się jako wolontariusz.
- **`POST /api/ideas/{id}/dislike`** – Negatywny głos.

### 4. Moduł `backend/chat` (Komunikator Ekspert ROPS Kraków <-> Mieszkańcy)
- **`POST /api/chat/conversations`** – Otwarcie czatu z ekspertem (przycisk *"Napisz do eksperta"* pod postem):
  - Przyjmuje opcjonalne `idea_id`, `idea_title`, `topic` oraz `initial_message`.
- **`GET /api/chat/conversations`** – Pobranie listy wątków:
  - Dla **administratora/eksperta**: pełny dashboard wszystkich zgłoszeń od mieszkańców z licznikami nieprzeczytanych wiadomości.
  - Dla **mieszkańca**: lista wyłącznie jego aktywnych rozmów.
- **`GET /api/chat/conversations/{id}`** – Szczegóły danej rozmowy.
- **`POST /api/chat/conversations/{id}/messages`** – Wysłanie wiadomości (odpowiedź eksperta lub użytkownika).
- **`GET /api/chat/conversations/{id}/messages`** – **POLLING co 3 sekundy**:
  - Obsługuje parametr `since` (ISO timestamp) lub `after_id` do pobierania wyłącznie nowych wiadomości.
  - Zwraca `last_polled_at` oraz automatycznie zeruje licznik nieprzeczytanych wiadomości.
- **`PATCH /api/chat/conversations/{id}/status`** – Zmiana statusu rozmowy (`open`, `in_progress`, `closed`).

---

## 🗄️ Baza Danych: Supabase

Wklej zawartość pliku [supabase_schema.sql](file:///c:/Users/fabia/hubmi/backend/supabase_schema.sql) do **Supabase SQL Editor**.
Skrypt utworzy:
- Tabelę `innovations` z kolumnami: `title`, `description`, `addressed_problems`, `funding_info`, `target_group`, `url`, `file_source`, `embedding vector(384)`.
- Indeks wektorowy `HNSW`.
- Funkcję RPC `match_innovations`.
- Tabele użytkowników i postów.

---

## 💻 Uruchomienie

```powershell
cd c:\Users\fabia\hubmi\backend
python main.py
```
lub:
```powershell
uvicorn main:app --reload
```

Swagger UI i testowanie endpointów:
👉 **`http://127.0.0.1:8000/docs`**
