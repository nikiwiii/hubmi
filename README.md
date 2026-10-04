# 🌟 MiNNO (Hubmi) – Cyfrowy Hub Innowacji Społecznych Małopolski

[![Next.js 16](https://img.shields.io/badge/Frontend-Next.js%2016%20%7C%20React%2019-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![FastAPI](https://img.shields.io/badge/Backend-FastAPI%20%7C%20Python%203.10+-009688?style=for-the-badge&logo=fastapi)](https://fastapi.tiangolo.com/)
[![Groq AI](https://img.shields.io/badge/AI-Groq%20Cloud%20LPU%20(LLaMA%203.3%2070B)-F55036?style=for-the-badge)](https://groq.com/)
[![Supabase](https://img.shields.io/badge/Database-Supabase%20(Postgres%20%2B%20pgvector)-3ECF8E?style=for-the-badge&logo=supabase)](https://supabase.com/)
[![WCAG 2.2 AAA](https://img.shields.io/badge/Accessibility-WCAG%202.2%20AAA%20Compliant-blue?style=for-the-badge)](https://www.w3.org/WAI/standards-guidelines/wcag/)

> **MiNNO** to zintegrowana platforma cyfrowa stworzona dla **Regionalnego Ośrodka Polityki Społecznej w Krakowie (ROPS Kraków)**, małopolskich samorządów (JST, CUS, OPS), organizacji pozarządowych oraz mieszkańców regionu.  
> Łączy **zweryfikowaną bazę 115 innowacji społecznych**, inteligentny silnik **RAG & Matching AI**, moduł **Middlemana Innowacji** adaptujący projekty do standardu usług publicznych, **interaktywne kartogramy 22 powiatów Małopolski** (GUS/ROPS 2014–2024) oraz zaawansowane narzędzia dostępności cyfrowej **WCAG 2.2 AAA**.

---

## 🌐 Wersja Demonstracyjna Live

Aplikacja jest wdrożona i dostępna publicznie pod adresem:
👉 **[https://hubmi.185.180.206.16.nip.io](https://hubmi.185.180.206.16.nip.io)**

### 🔑 Konta demonstracyjne:

| Rola | E-mail | Hasło | Uprawnienia |
| :--- | :--- | :--- | :--- |
| **Administrator (ROPS)** | `admin@hubmi.com` | `admin` | Pełny dostęp: panel koordynatora, moderacja pomysłów, testerzy, użytkownicy |
| **Użytkownik / Twórca** | `user@hubmi.com` | `user123` | Zgłaszanie innowacji w kreatorze, reakcje społeczności, czat z ekspertem |
| **Tester innowacji** | `tester@gmail.com` | `tester123` | Dostęp do strefy testowania innowacji, zgłoszenia ewaluacyjne |

---

## 🎯 Jaki problem rozwiązujemy?

1. **Bariera transferu innowacji:** Gotowe innowacje społeczne z programów ROPS rzadko trafiają do gmin z powodu braku narzędzi adaptacyjnych.
2. **Deficyty wiedzy lokalnej:** Samorządom brakuje szybkich diagnoz łączących dane statystyczne o problemach społecznych powiatu z konkretnymi rozwiązaniami.
3. **Biurokracja wdrożeniowa:** Przekształcenie pomysłu w formalną usługę CUS/OPS z budżetem i harmonogramem zajmowało dotąd tygodnie.

**MiNNO skraca ten proces do kilkunastu sekund dzięki AI.**

---

## 🚀 Główne Moduły Platformy

```
┌────────────────────────────────────────────────────────────────────────┐
│                              PLATFORMA MiNNO                           │
├───────────────┬───────────────┬────────────────┬───────────────┬───────┤
│   ODKRYWAJ    │   ASYSTENT    │   MIDDLEMAN    │    RAPORTY    │ CZAT  │
│ 115 Innowacji │   RAG / AI    │ Usługi CUS/OPS │ 22 Powiaty    │ ROPS  │
│  Wideo & Test │ Semantyka 5%  │ Budżet & Etaty │ GUS 2014-2024 │ Live  │
└───────────────┴───────────────┴────────────────┴───────────────┴───────┘
```

### 1. 🔍 Katalog Innowacji Społecznych (`/`)
* Baza **115 zweryfikowanych innowacji** z Małopolski z kategoryzacją tematyczną (Seniorzy, Osoby z Niepełnosprawnościami, Dzieci i Młodzież, Zdrowie, Społeczność).
* Kompleksowe metryki: opis problemu, grupa docelowa, model finansowania, wideo demonstracyjne i opcja zgłoszenia się jako tester.

### 2. 🤖 Inteligentny Doradca RAG & Semantyczny Matching (`/matching`)
* Wyszukiwanie semantyczne oparte na **embeddingach wektorowych** (384-wymiarowy model `all-MiniLM-L6-v2`) i ultraszybkiej inferencji **Groq Cloud LPU**.
* **Zasada 5% Najlepszych Dopasowań:** Wskazuje lidera oraz maksymalnie 2 alternatywy w ścisłym marginesie jakościowym.
* **Guardrails tematyczne:** Odrzuca zapytania niezwiązane z polityką społeczną (`BLOCKED_OFF_TOPIC`) lub brak trafień z rekomendacją kontaktu (`BLOCKED_NOT_FOUND`).
* Transparentny milisekundowy tracing procesu decyzyjnego AI.

### 3. 🤝 Middleman Innowacji dla Samorządów (`/middleman`)
* **Innowacja procesowa MiNNO:** Zamienia opis dowolnej innowacji w gotową **Kartę Standardu Usługi Społecznej** dla Centrów Usług Społecznych (CUS) i OPS.
* Automatycznie generuje:
  * Wymagane etaty i kwalifikacje personelu,
  * Szacunkowy kosztorys i montaż finansowy (środki gminy, EFS+, PFRON),
  * Harmonogram wdrożenia (przygotowanie, pilotaż, ewaluacja),
  * Wskaźniki sukcesu (KPI) oraz matrycę ryzyk.
* Interaktywne doprecyzowanie (*"Mamy 30% mniejszy budżet i brak psychologa"*) oraz eksport do gotowego dokumentu.

### 4. 📊 Raporty, Wskaźniki i Kartogramy ROPS (`/knowledge`)
* Baza **1 188 punktów pomiarowych** z lat 2014–2024 dla wszystkich **22 powiatów Małopolski** (17 wskaźników GUS/ROPS).
* Interaktywne wektorowe kartogramy SVG ze skalą nasycenia barw i wykresami trendów.
* **Knowledge RAG:** Silnik analizujący zapytania typu: *"Jak wygląda depopulacja i starzenie się w powiecie nowosądeckim?"* i łączący statystyki z rekomendacjami innowacji.

### 5. 💡 Kreator Pomysłów Mieszkańców (`/propose`)
* Asystent konwersacyjny AI prowadzący mieszkańca od luźnej myśli do dojrzałego projektu innowacji społecznej.
* Generowanie wizualizacji prototypu (AI image generation).
* Publikacja fiszki do społeczności z mechanizmem głosowania i deklaracji wolontariatu.

### 6. 💬 Komunikator z Ekspertami ROPS (`/chat`)
* Bezpośredni kanał wsparcia łączący innowatorów z zespołem merytorycznym ROPS Kraków.
* Zarządzanie cyklem zgłoszenia (otwarte, w trakcie, zamknięte).

### 7. 🛡️ Panel Koordynatora i Administratora (`/dashboard`)
* Zarządzanie bazą użytkowników (Twórcy, Testerzy, Administratorzy) połączone bezpośrednio z bazą Supabase.
* Moderacja i akceptacja nadesłanych pomysłów społecznych.
* Obsługa wniosków kandydatów na testerów innowacji.
* Konfiguracja naborów grantowych.

### 8. ♿ Laboratorium Dostępności Cyfrowej WCAG 2.2 AAA (`/testing`)
* Symulator wad wzroku działający w czasie rzeczywistym:
  * Daltonizm: Protanopia, Deuteranopia, Tritanopia,
  * Zaćma (rozmycie i spadek kontrastu),
  * Jaskra (widzenie tunelowe).
* Tryb wysokiego kontrastu, skalowanie typografii do 200%, pełna nawigacja klawiaturą z indykatorami fokusu.

---

## 🛠️ Stos Technologiczny

| Warstwa | Technologie |
| :--- | :--- |
| **Frontend** | **Next.js 16 (App Router)**, React 19, TypeScript, Vanilla CSS + Tailwind CSS, Lucide Icons |
| **Backend** | **Python 3.10+**, **FastAPI**, Pydantic v2, Uvicorn, HTTPX, PyJWT, Bcrypt |
| **Sztuczna Inteligencja** | **Groq Cloud LPU** (LLaMA 3.3 70B Versatile), `sentence-transformers` (`all-MiniLM-L6-v2`), Pollinations AI |
| **Baza Danych** | **Supabase (PostgreSQL 16 + pgvector)** z automatycznym silnikiem fallback SQLite/In-memory |
| **Infrastruktura & DevOps** | **Docker & Docker Compose**, Nginx Reverse Proxy, certyfikaty SSL/TLS |

---

## ⚡ Szybkie Uruchomienie

### Opcja A: Docker Compose (Zalecana)

```bash
# 1. Klonowanie repozytorium
git clone https://github.com/twoj-org/hubmi.git
cd hubmi

# 2. Uruchomienie całego stosu (Backend + Frontend)
docker compose up -d --build
```
Aplikacja uruchomi się na portach:
* Frontend: `http://localhost:3005` (lub port zmapowany w `docker-compose.yml`)
* Backend API: `http://localhost:8000`
* Swagger Docs: `http://localhost:8000/docs`

---

### Opcja B: Uruchomienie lokalne (Development)

#### 1. Backend (FastAPI):
```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate   # Na Windows: .venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

#### 2. Frontend (Next.js):
```bash
cd front
npm install
npm run dev
```
Aplikacja będzie dostępna pod adresem: `http://localhost:3000`.

---

## 📁 Struktura Projektu

```
hubmi/
├── backend/                  # Serwer FastAPI
│   ├── chat/                 # Moduł komunikatora i zgłoszeń
│   ├── idea_creator/         # Asystent AI i kreator innowacji
│   ├── ideas/                # Tablica pomysłów i reakcje społeczności
│   ├── indicators/           # Moduł statystyk 22 powiatów i RAG wskaźników
│   ├── innovations/          # Baza 115 innowacji ROPS i kategoryzacja
│   ├── login/                # Autoryzacja JWT, role i zarządzanie profilami
│   ├── matching/             # Silnik dopasowywania semantycznego RAG
│   ├── middleman/            # Generator standardu usług publicznych CUS
│   ├── main.py               # Główna aplikacja FastAPI
│   ├── supabase_client.py    # Repozytorium danych Supabase + Fallback
│   └── requirements.txt      # Zależności Pythona
├── front/                    # Aplikacja Next.js 16 (App Router)
│   ├── app/                  # Trasy i widoki aplikacji
│   │   ├── components/       # Komponenty UI (Dashboard, Matching, Middleman, itp.)
│   │   ├── context/          # Kontekst aplikacji (użytkownik, motyw, dostępność)
│   │   ├── lib/              # Klient API, typy TypeScript i logika autoryzacji
│   │   ├── matching/         # Widok Asystenta RAG
│   │   ├── middleman/        # Widok Middlemana Innowacji CUS
│   │   ├── knowledge/        # Widok Raportów i Kartogramów
│   │   ├── dashboard/        # Panel Zarządzania i Administracji
│   │   └── page.tsx          # Strona główna (Katalog Innowacji)
│   └── package.json          # Zależności Node.js
└── docker-compose.yml        # Konfiguracja środowiska kontenerowego
```

---

## 🔒 Bezpieczeństwo i Dostępność

* **Zgodność z WCAG 2.2 AAA:** Zaprojektowano zgodnie z polską Ustawą o Dostępności Cyfrowej stron internetowych i aplikacji mobilnych podmiotów publicznych.
* **Ochrona danych i RODO:** Bezpieczne hashowanie haseł (bcrypt), bezstanowe tokeny JWT (HS256) oraz separacja ról w systemie.
* **Niezawodność (Zero-Downtime Design):** Hybrydowa architektura bazy danych – przy problemach z zewnętrznym dostawcą baza automatycznie przełącza się na lokalny silnik danych bez przerywania pracy użytkownika.

---

*Projekt zrealizowany w ramach Hackathonu dla Małopolski i Regionalnego Ośrodka Polityki Społecznej w Krakowie.*
