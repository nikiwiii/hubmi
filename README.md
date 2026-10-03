# Hubmi - FastAPI + Supabase + RAG Matching (Groq AI) + Next.js

Platforma społecznościowa dla mieszkańców Małopolski i Regionalnego Ośrodka Polityki Społecznej w Krakowie (ROPS Kraków). System łączy bazę innowacji społecznych, inteligentnego doradcę **RAG z Groq AI**, interaktywną mapę powiatów Małopolski, moduł konsultacji pomysłów oraz bezpośredni komunikator z ekspertami.

---

## 📁 Struktura Projektu

```text
hubmi/
├── backend/                       # Serwer FastAPI (Python 3.10+)
│   ├── login/                     # Uwierzytelnianie i profile użytkowników
│   │   ├── schemas.py             # Modele Pydantic (User, Admin, Register, Profile)
│   │   ├── service.py             # Logika autoryzacji, hashowanie bcrypt, tokeny JWT
│   │   └── router.py              # Endpointy: /api/login/user, /register, /admin, /me
│   ├── ideas/                     # Społeczność: Posty, pomysły i reakcje mieszkańców
│   │   ├── schemas.py             # Modele Pydantic (IdeaCreate, ReactionRequest)
│   │   ├── service.py             # Logika postów, usuwanie (autor/admin), liczniki reakcji
│   │   └── router.py              # Endpointy: /api/ideas/ (CRUD, like, volunteer, dislike)
│   ├── matching/                  # 🤖 Silnik RAG: Vector search + Groq AI + Guardrails
│   │   ├── embeddings.py          # Generowanie embeddingów (all-MiniLM-L6-v2), podobieństwo kosinusowe
│   │   ├── schemas.py             # Modele: MatchRequest, MatchResponse, TraceStep, Explainability
│   │   ├── service.py             # Hybrid search, filtr 5%, Guardrails, synteza Groq (max 1500 tokens)
│   │   └── router.py              # Endpointy: /api/matching/chat, /match, /innovations
│   ├── innovations/               # 📦 Dedykowany moduł JSON Bazy Innowacji Społecznych
│   │   └── router.py              # Endpointy: /api/innovations, /api/innovations/{id}, /all
│   ├── chat/                      # 💬 Komunikator ROPS: Ekspert <-> Mieszkańcy (Polling 3s)
│   │   ├── schemas.py             # Modele Pydantic (ConversationCreate, MessageCreate)
│   │   ├── service.py             # Zarządzanie wątkami, statusy, polling przyrostowy
│   │   └── router.py              # Endpointy: /api/chat/conversations, /messages, /status
│   ├── config.py                  # Konfiguracja środowiska, klucze API, progi podobieństwa
│   ├── supabase_client.py         # Klient Supabase z automatycznym fallbackiem in-memory
│   ├── supabase_schema.sql        # Pełny schemat DDL bazy danych (PostgreSQL / Supabase)
│   ├── seed_indicators.py         # Skrypt ładujący wskaźniki powiatów do Supabase
│   ├── visualize_data.json        # Zbiór danych statystycznych dla 22 powiatów Małopolski (GUS)
│   ├── main.py                    # Główna aplikacja FastAPI + konfiguracja CORS + OpenAPI
│   └── requirements.txt           # Zależności backendu (FastAPI, supabase, groq, sentence-transformers)
├── front/                         # Aplikacja internetowa (Next.js 16 + React 19 + Tailwind v4)
│   ├── app/
│   │   ├── components/            # Komponenty UI (Nawigacja, Autoryzacja, Czat)
│   │   │   ├── knowledge/         # Zasobnik wiedzy: Doradca RAG, Mapa Małopolski
│   │   │   │   ├── RagChatSection.tsx  # Doradca z pełnym renderowaniem Markdown (react-markdown)
│   │   │   │   └── MalopolskaMap.tsx   # Interaktywna mapa 22 powiatów z danymi GUS
│   │   │   ├── ChatScreen.tsx     # Komunikator z ekspertami ROPS (polling co 3s)
│   │   │   └── BrowseIdeasScreen.tsx # Przeglądanie pomysłów z filtrami i reakcjami
│   │   └── lib/                   # api.ts, typy TypeScript, obsługa JWT i stanu
│   └── package.json
└── front-mobile/                  # Aplikacja mobilna (React Native / Expo)
```

---

## 🔑 Domyślne Konto Administratora

Do testowania panelu administratora i funkcji moderacji:
- **E-mail:** `test@gmail.com`
- **Hasło:** `test123`
- **Rola:** `admin` (dostęp do endpointów administracyjnych i panelu zarządzania)

---

## 🚀 Endpointy Backendowe (REST API)

### 1. Innowacje Społeczne (`/api/innovations`)
- **`GET /api/innovations`** – Pobiera listę innowacji z pełnymi polami (tytuł, opis, problemy, grupa docelowa, beneficjenci, walidacja, autorzy, dofinansowanie, link źródłowy ROPS itp.).
  - Parametry opcjonalne:
    - `include_embedding=true` – dołącza wektor embeddingu (domyślnie `false`),
    - `search=fraza` – filtrowanie po słowach kluczowych,
    - `limit=N`, `offset=M` – paginacja.
- **`GET /api/innovations/{id}`** – Zwraca komplet danych pojedynczej innowacji na podstawie identyfikatora UUID.
- **`GET /api/innovations/all`** – Kompletny zrzut 100% bazy danych wraz z wektorami embeddingów.

### 2. Inteligentny Doradca RAG & Wyszukiwanie Wektorowe (`/api/matching`)
- **`POST /api/matching/chat`** (alias `/api/matching/match`):
  - **Dopasowanie semantyczne:** Wyszukiwanie wektorowe z modelem `all-MiniLM-L6-v2` po bazie 115 innowacji.
  - **Reguła 5%:** Wskazuje najlepsze dopasowanie oraz do 2 alternatyw z wynikiem mieszczącym się w granicy 5% różnicy.
  - **Guardrails / Bezpieczeństwo:**
    - Wykrywanie pytań off-topic (przepisy, dowcipy) ➔ status `BLOCKED_OFF_TOPIC`.
    - Brak dopasowania w bazie innowacji ➔ status `BLOCKED_NOT_FOUND`.
  - **Explainability:** Uzasadnienie, dlaczego innowacja pasuje do sytuacji użytkownika, oraz źródła finansowania.
  - **Synteza Groq AI:** Odpowiedź doradcza generowana przez model LLaMA (z limitem 1500 tokenów i sformatowana w czystym Markdown).
  - **Tracing:** Szczegółowy ślad wykonania każdego etapu z czasem trwania (ms).
- **`GET /api/matching/innovations`** – Lista innowacji dla silnika dopasowującego.

### 3. Komunikator z Ekspertami ROPS Kraków (`/api/chat`)
- **`POST /api/chat/conversations`** – Otwarcie nowej rozmowy z ekspertem (np. przycisk *"Napisz do eksperta"* pod pomysłem).
- **`GET /api/chat/conversations`** – Lista wątków (dla mieszkańca: jego sprawy; dla administratora: dashboard wszystkich zgłoszeń).
- **`GET /api/chat/conversations/{id}`** – Szczegóły wybranego wątku.
- **`POST /api/chat/conversations/{id}/messages`** – Wysłanie nowej wiadomości.
- **`GET /api/chat/conversations/{id}/messages`** – **Polling co 3 sekundy**: przyrostowe pobieranie wiadomości z parametrem `since` lub `after_id`.
- **`PATCH /api/chat/conversations/{id}/status`** – Zmiana statusu sprawy (`open`, `in_progress`, `closed`).

### 4. Uwierzytelnianie i Profile (`/api/login`)
- **`POST /api/login/user`** – Logowanie mieszkańca / użytkownika.
- **`POST /api/login/admin`** – Logowanie administratora.
- **`POST /api/login/register`** – Rejestracja nowego konta.
- **`GET /api/login/me`** – Informacje o aktualnie zalogowanym profilu.

### 5. Pomysły i Reakcje Społeczności (`/api/ideas`)
- **`GET /api/ideas/`** – Lista pomysłów z licznikami reakcji i stanem polubień użytkownika.
- **`POST /api/ideas/`** – Dodanie nowego pomysłu.
- **`DELETE /api/ideas/{id}`** – Usunięcie pomysłu (przez autora lub administratora).
- **`POST /api/ideas/{id}/react`** (lub `/like`, `/volunteer`, `/dislike`) – Przełączanie reakcji (toggle).

---

## 🗄️ Baza Danych (Supabase / PostgreSQL)

Baza danych zawiera następujące tabele:
1. **`innovations`** – 115 innowacji społecznych z kolumnami metadanych, opisami, źródłami i wektorem `embedding vector(384)`.
2. **`indicators`** – Wskaźniki statystyczne (5 wskaźników: ludność w wieku produkcyjnym, bezrobocie długotrwałe, zasiłki, rodziny zastępcze, czas hospitalizacji).
3. **`indicator_measurements`** – 1 188 punktów pomiarowych dla 22 małopolskich powiatów w latach 2014–2024.
4. **`users`** – Profile użytkowników z hashowaniem haseł (bcrypt) i rolami (`user`, `admin`).
5. **`ideas`** oraz **`reactions`** – Pomysły mieszkańców i głosy społeczności.
6. **`chat_conversations`** oraz **`chat_messages`** – Wątki i wiadomości komunikatora ROPS.

### Inicjalizacja i import danych:
- Schemat tabel: wklej zawartość pliku [backend/supabase_schema.sql](file:///c:/Users/fabia/hubmi/backend/supabase_schema.sql) w Supabase SQL Editor.
- Import wskaźników powiatów:
  ```powershell
  cd backend
  python seed_indicators.py
  ```

---

## 💻 Uruchomienie Projektu

### Sposób 1: Automatyczny start (Windows)
W głównym katalogu projektu uruchom:
```powershell
.\start_all.ps1
```
lub w wierszu poleceń (cmd):
```cmd
start.bat
```
Skrypt uruchomi backend (FastAPI, port 8000) oraz frontend (Next.js, port 3000) w oddzielnych oknach.

---

### Sposób 2: Uruchomienie ręczne

#### 1. Backend (FastAPI):
```powershell
cd c:\Users\fabia\hubmi\backend
python -m uvicorn main:app --reload --port 8000
```
- Dokumentacja Swagger: 👉 **`http://127.0.0.1:8000/docs`**
- OpenAPI JSON: 👉 **`http://127.0.0.1:8000/openapi.json`**

#### 2. Frontend (Next.js):
```powershell
cd c:\Users\fabia\hubmi\front
npm run dev
```
- Aplikacja WWW: 👉 **`http://localhost:3000`**

#### 3. Aplikacja Mobilna (Expo / React Native - opcjonalnie):
```powershell
cd c:\Users\fabia\hubmi\front-mobile
npx expo start
```

---

## 🎨 Frontend & UI

- **Typografia i Markdown:** Odpowiedzi Doradcy RAG są renderowane za pomocą bibliotek `react-markdown` oraz `remark-gfm` z dedykowaną, czytelną typografią dopasowaną do identyfikacji wizualnej Hubmi.
- **Interaktywna Mapa:** Komponent [MalopolskaMap.tsx](file:///c:/Users/fabia/hubmi/front/app/components/knowledge/MalopolskaMap.tsx) umożliwia przeglądanie innowacji i wskaźników statystycznych per powiat.
- **Komunikator na żywo:** Obsługa automatycznego odpytywania co 3 sekundy w tle bez blokowania interfejsu.
