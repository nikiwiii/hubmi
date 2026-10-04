# 🌟 Hubmi (MiNNO) – Cyfrowe Serce Małopolskiego Hubu Innowacji Społecznych

> **Zintegrowana platforma wspierająca Regionalny Ośrodek Polityki Społecznej w Krakowie (ROPS Kraków), małopolskie samorządy (JST, CUS, OPS), organizacje pozarządowe (NGO) oraz mieszkańców.**  
> Łączy zweryfikowaną bazę 115 innowacji społecznych, inteligentnego doradcę **RAG z Groq AI**, moduł **Middlemana Innowacji** dla instytucji publicznych, interaktywne **kartogramy 22 powiatów Małopolski** z danymi GUS/ROPS (2014–2024), **kreator pomysłów z generatorem prototypów AI**, bezpośredni **komunikator z ekspertami ROPS** oraz unikalne **Laboratorium Dostępności Cyfrowej WCAG 2.2 AAA**.

---

## 📑 Spis Treści
1. [Wizja i Misja Projektu](#-wizja-i-misja-projektu)
2. [Kluczowe Moduły i Funkcjonalności](#-kluczowe-moduły-i-funkcjonalności)
   - [1. Katalog Innowacji Społecznych (`/discover`)](#1-katalog-innowacji-społecznych-discover)
   - [2. Inteligentny Doradca RAG & Matching Semantyczny (`/matching`)](#2-inteligentny-doradca-rag--matching-semantyczny-matching)
   - [3. Middleman Innowacji dla Instytucji Publicznych (`/middleman`)](#3-middleman-innowacji-dla-instytucji-publicznych-middleman)
   - [4. Baza Raportów & Kartogramy ROPS / RAG Wskaźników (`/knowledge`)](#4-baza-raportów--kartogramy-rops--rag-wskaźników-knowledge)
   - [5. Kreator Nowych Pomysłów i Innowacji (`/propose`)](#5-kreator-nowych-pomysłów-i-innowacji-propose)
   - [6. Społeczność Obywatelska & Tablica Pomysłów (`/api/ideas`)](#6-społeczność-obywatelska--tablica-pomysłów-apiideas)
   - [7. Komunikator z Ekspertami ROPS Kraków (`/chat`)](#7-komunikator-z-ekspertami-rops-kraków-chat)
   - [8. Generator Wniosków Grantowych i Panel Koordynatora (`/admin`)](#8-generator-wniosków-grantowych-i-panel-koordynatora-admin)
   - [9. Laboratorium Dostępności Cyfrowej WCAG 2.2 AAA (`/testing`)](#9-laboratorium-dostępności-cyfrowej-wcag-22-aaa-testing)
   - [10. System Powiadomień i Symulator E-mail (`/api/notifications`)](#10-system-powiadomień-i-symulator-e-mail-apinotifications)
   - [11. Aplikacja Mobilna Mieszkańca (`front-mobile`)](#11-aplikacja-mobilna-mieszkańca-front-mobile)
3. [Architektura Techniczna i Stos Technologiczny](#-architektura-techniczna-i-stos-technologiczny)
4. [Baza Danych i Zasoby Informacyjne](#-baza-danych-i-zasoby-informacyjne)
5. [Przewodnik po REST API (Swagger & OpenAPI)](#-przewodnik-po-rest-api-swagger--openapi)
6. [Konta Testowe i Dostęp Demonstracyjny](#-konta-testowe-i-dostęp-demonstracyjny)
7. [Szybkie Uruchomienie (Instrukcja Krok po Kroku)](#-szybkie-uruchomienie-instrukcja-krok-po-kroku)
8. [Dostępność Cyfrowa (WCAG 2.2) i Bezpieczeństwo](#-dostępność-cyfrowa-wcag-22-i-bezpieczeństwo)
9. [Kosztorys i Utrzymanie (TCO)](#-kosztorys-i-utrzymanie-tco)

---

## 🎯 Wizja i Misja Projektu

Innowacje społeczne wypracowane w Małopolsce często napotykają barierę skalowania: urzędnicy w gminach nie wiedzą o gotowych rozwiązaniach, mieszkańcy nie mają narzędzi do szybkiego zgłaszania lokalnych potrzeb, a adaptacja innowacji do ram prawnych i budżetowych Centrów Usług Społecznych (CUS) czy Ośrodków Pomocy Społecznej (OPS) bywa skomplikowana i czasochłonna.

**Hubmi (MiNNO)** rozwiązuje te problemy w jednym punkcie styku:
* **Dla ROPS Kraków:** Zautomatyzowane repozytorium innowacji, narzędzie analityczne diagnozujące deficyty powiatów w czasie rzeczywistym oraz odciążenie koordynatorów dzięki asystentom AI.
* **Dla JST, CUS, OPS i NGO:** Moduł *Middleman* zamieniający opis innowacji w gotową kartę wdrożeniową usługi publicznej (z harmonogramem, szacunkiem budżetowym, KPI i ryzykami) gotową do druku lub wniosku o dofinansowanie.
* **Dla Mieszkańców i Społeczności:** Przyjazny kreator pomysłów wspierany przez AI, wizualizacje prototypów, tablica inicjatyw z głosowaniem oraz bezpośredni czat z mentorami ROPS.

---

## 🧩 Kluczowe Moduły i Funkcjonalności

```
                                  ┌────────────────────────┐
                                  │      HUBMI (MiNNO)     │
                                  └───────────┬────────────┘
         ┌──────────────────┬─────────────────┼──────────────────┬──────────────────┐
         ▼                  ▼                 ▼                  ▼                  ▼
  ┌──────────────┐   ┌──────────────┐  ┌──────────────┐   ┌──────────────┐   ┌──────────────┐
  │   KATALOG    │   │ DORADCA RAG  │  │   MIDDLEMAN  │   │  KARTOGRAMY  │   │  LABORATORIUM│
  │  INNOWACJI   │   │  SEMANTYCZNY │  │   USŁUG CUS  │   │ I DIAGNOZY   │   │     WCAG     │
  │  115 pozycji │   │ < 1.2s Groq  │  │ AI Adaptacja │   │ 22 powiaty   │   │   2.2 AAA    │
  └──────────────┘   └──────────────┘  └──────────────┘   └──────────────┘   └──────────────┘
```

---

### 1. Katalog Innowacji Społecznych (`/discover`)
Pełna baza **115 zweryfikowanych innowacji społecznych** zrealizowanych w ramach programów ROPS Kraków.
* **Filtrowanie wielokryterialne:** wg obszarów tematycznych (Seniorzy, Osoby z Niepełnosprawnościami, Rodziny, Edukacja, Zdrowie, Cyfryzacja), grup docelowych oraz statusu gotowości wdrożeniowej.
* **Bogata karta innowacji:** tytuł, geneza problemu, opis rozwiązania, odbiorcy, model biznesowo-finansowy, wymogi licencyjne oraz oryginalne materiały źródłowe ROPS.
* **Materiały wideo i multimedia:** bezpośrednio osadzone wideoprezentacje innowatorów.
* **Dołącz do grona testerów:** szybkie zgłoszenie chęci przetestowania rozwiązania we własnej gminie lub organizacji.

---

### 2. Inteligentny Doradca RAG & Matching Semantyczny (`/matching`)
Zaawansowany system konwersacyjny łączący wyszukiwanie semantyczne (Vector Search) z ultraszybką syntezą Groq LPU (LLaMA 3.3 70B / Qwen):
* **Silnik Embeddingów:** Wektoryzacja pytań użytkownika w locie przy użyciu modelu `sentence-transformers/all-MiniLM-L6-v2` (384 wymiary).
* **Reguła 5% Najlepszych Alternatyw:** System wskazuje bezwzględnego lidera dopasowania oraz maksymalnie 2 innowacje alternatywne, których podobieństwo kosinusowe mieści się w granicach 5% od najlepszego wyniku.
* **Guardrails Bezpieczeństwa Tematycznego:**
  * Odrzucanie zapytań niezwiązanych z tematyką społeczną (np. przepisy kulinarne, dowcipy) ze statusem `BLOCKED_OFF_TOPIC`.
  * Informowanie o braku zbieżności w bazie innowacji (`BLOCKED_NOT_FOUND`) z propozycją kontaktu z konsultantem.
* **Wyjaśnialność (Explainability):** Generowanie konkretnego uzasadnienia, dlaczego dana innowacja odpowiada opisanej sytuacji życiowej lub wyzwaniu gminy, wraz ze wskazaniem źródeł finansowania.
* **Milisekundowy Tracing:** Transparentny podgląd każdego etapu wykonania zapytania (Vector Search -> Guardrails -> LLM Generation) wraz z czasem wykonania w ms.
* **Zero-Downtime Fallback:** W razie niedostępności chmurowej bazy wektorowej, system automatycznie przełącza się na lokalny silnik kosinusowy in-memory.

---

### 3. Middleman Innowacji dla Instytucji Publicznych (`/middleman`)
**Unikalna innowacja procesowa platformy Hubmi.** Moduł asystenta AI dedykowany pracownikom jednostek samorządu terytorialnego (JST), Centrów Usług Społecznych (CUS), Ośrodków Pomocy Społecznej (OPS) i fundacji:
* **Automatyczna Transformacja w Kartę Usługi:** Zamienia opis innowacji w formalny standard usługi publicznej:
  * **Zakres i model świadczenia:** specyfikacja procedury krok po kroku.
  * **Niezbędne zasoby:** kadrowe (etaty, kwalifikacje), lokalowe i technologiczne.
  * **Harmonogram wdrożenia:** fazy przygotowania, pilotażu i ewaluacji.
  * **Szacunkowy budżet:** pozycje kosztowe dostosowane do wielkości gminy.
  * **Montaż finansowy:** źródła finansowania (EFS+, PFRON, środki własne gminy, granty ROPS).
  * **Wskaźniki sukcesu (KPI) oraz matryca ryzyk:** mechanizmy zarządcze dla dyrektorów instytucji.
* **Konwersacyjne Doprecyzowanie (Refine with AI):** Urzędnik może polecić asystentowi: *„Mamy budżet mniejszy o 40% i brak psychologa na etacie”*, a model natychmiast przelicza harmonogram i proponuje wariant oszczędnościowy.
* **Eksport do druku / PDF:** Generowanie czystego, sformatowanego dokumentu gotowego na sesję rady gminy lub naradę wydziału.

---

### 4. Baza Raportów & Kartogramy ROPS / RAG Wskaźników (`/knowledge`)
Moduł analityki terytorialnej oparty na oficjalnych danych statystycznych:
* **17 Wskaźników Statystycznych (GUS / ROPS) z lat 2014–2024:**
  * 1 188 precyzyjnych punktów pomiarowych dla wszystkich **22 powiatów Województwa Małopolskiego**.
  * Wskaźniki m.in.: ludność w wieku poprodukcyjnym, bezrobocie długotrwałe, beneficjenci zasiłków pomocy społecznej, piecza zastępcza, czas hospitalizacji, wsparcie osób z niepełnosprawnościami.
* **Interaktywne Kartogramy Wektorowe SVG:**
  * Wizualizacja rozkładu problemów społecznych w powiatach Małopolski z gradientem skali barwnej.
  * Dynamiczne wykresy liniowe i słupkowe trendów 10-letnich (2014–2024).
* **Knowledge RAG Service (`/api/indicators/rag`):**
  * Dedykowany moduł RAG analizujący zapytania typu: *„Jak wygląda sytuacja seniorów w powiecie nowosądeckim w porównaniu do reszty regionu?”*.
  * Automatycznie wyciąga surowe wskaźniki, oblicza rangę powiatu i syntetyzuje wnioski analityczne połączone z rekomendacjami konkretnych innowacji z bazy ROPS.

---

### 5. Kreator Nowych Pomysłów i Innowacji (`/propose`)
Interaktywny moduł włączający mieszkańców i liderów lokalnych w tworzenie innowacji oddolnych:
* **Wieloetapowy Asystent Twórczy AI (`/api/idea-creator`):**
  * Pomaga mieszkańcowi przejść od surowej myśli (*„brakuje ławek dla starszych osób”*) do dojrzałego projektu innowacji społecznej.
  * AI diagnozuje problem, proponuje innowacyjną formułę rozwiązania, określa grupę beneficjentów i sugeruje etap dojrzałości projektu.
* **Generowanie Wizualizacji Prototypu (AI Image Generation):**
  * Asystent automatycznie generuje realistyczną koncepcję wizualną zgłaszanego projektu (np. ogród terapeutyczny, mobilny punkt wsparcia).
* **Publikacja do Społeczności:** Jedno kliknięcie publikuje dojrzałą fiszkę na tablicy inicjatyw.

---

### 6. Społeczność Obywatelska & Tablica Pomysłów (`/api/ideas`)
Partycypacyjny hub mieszkańców Małopolski:
* **Przegląd inicjatyw sąsiedzkich:** Filtrowanie według kategorii społecznych i etapu realizacji (pomysł, prototyp, wdrożenie).
* **System 3 Reakcji Obywatelskich:**
  * 💚 **Popieram:** wsparcie inicjatywy przez mieszkańców.
  * 🤝 **Dołączam / Wolontariat:** zgłoszenie chęci bezpośredniego udziału w zespole projektowym.
  * 💡 **Konstruktywna sugestia:** zgłoszenie uwag lub propozycji usprawnień.
* **Moderacja i Bezpieczeństwo:** Autor ma pełną kontrolę nad edycją, a administratorzy ROPS czuwają nad kulturą debaty.

---

### 7. Komunikator z Ekspertami ROPS Kraków (`/chat`)
Bezpośredni most komunikacyjny między pomysłodawcami a mentorami i koordynatorami ROPS:
* **Wątki zgłoszeniowe (Ticketing):** Możliwość otwarcia wątku konsultacyjnego bezpośrednio spod karty innowacji lub pomysłu.
* **Priorytetowy Polling co 3 sekundy:** Lekki, bezawaryjny mechanizm przyrostowej wymiany wiadomości (`since` / `after_id`) niewymagający skomplikowanych brokerów WebSockets.
* **Zarządzanie Cyklem Sprawy:** Statusy zgłoszeń (`open`, `in_progress`, `closed`) ułatwiające pracę konsultantów ROPS.

---

### 8. Generator Wniosków Grantowych i Panel Koordynatora (`/admin`)
Centrum dowodzenia dla zespołu koordynatorów Regionalnego Ośrodka Polityki Społecznej:
* **Kreator Formularzy Aplikacyjnych:** Automatyczne uzupełnianie pól wniosku na podstawie danych z innowacji i wskaźników powiatowych.
* **Walidator Kryteriów Formalnych:** Kontrola kompletności załączników i poprawności budżetu.
* **Generowanie Oficjalnych Dokumentów PDF:** Pobieranie gotowych do podpisu kart projektowych.
* **Panel Moderacji i Zarządzania Zgłoszeniami:** Przegląd napływających pomysłów, weryfikacja kandydatów na testerów innowacji.

---

### 9. Laboratorium Dostępności Cyfrowej WCAG 2.2 AAA (`/testing`)
Kompletny poligon doświadczalny dostępności wbudowany bezpośrednio w aplikację:
* **Symulator Wad Wzroku w Czasie Rzeczywistym:**
  * **Protanopia** (nierozpoznawanie czerwieni),
  * **Deuteranopia** (nierozpoznawanie zieleni),
  * **Tritanopia** (nierozpoznawanie niebieskiego),
  * **Zaćma (Cataract)** – symulacja rozmycia i zamglenia soczewki oka,
  * **Jaskra (Glaucoma)** – symulacja widzenia tunelowego.
* **Weryfikator Kontrastu Kolorów:** Narzędzie mierzące współczynnik kontrastu tekstu do tła według standardu WCAG (4.5:1 dla AA, 7:1 dla AAA).
* **Pełna Obsługa Klawiatury:** Wszystkie komponenty posiadają widoczne indykatory fokusu (`focus-visible:ring-2`) i logiczną kolejność tabulacji.

---

### 10. System Powiadomień i Symulator E-mail (`/api/notifications`)
* Powiadomienia w aplikacji informujące o statusie zgłoszeń, nowych wiadomościach od eksperta i otwarciu naborów grantowych.
* **Symulator E-mail dla Jury:** Dedykowany endpoint `/api/notifications/{id}/email` pozwalający jurorom i audytorom podejrzeć szablony transakcyjnych wiadomości e-mail wysyłanych do wnioskodawców.

---

### 11. Aplikacja Mobilna Mieszkańca (`front-mobile`)
Projekt aplikacji mobilnej opartej o **React Native / Expo**:
* Szybki dostęp do bazy innowacji w terenie dla pracowników socjalnych i mieszkańców.
* Geolokalizacja ułatwiająca odkrywanie projektów w najbliższym powiecie.

---

## 🏗️ Architektura Techniczna i Stos Technologiczny

```
┌────────────────────────────────────────────────────────────────────────┐
│                        UŻYTKOWNIK KOŃCOWY                              │
│         (Mieszkańcy, Samorządy JST, CUS, OPS, NGO, ROPS Kraków)        │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ HTTPS / WCAG 2.2 AAA
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│               WARSTWA PREZENTACJI (Next.js 16 + React 19)              │
│  - Tailwind CSS v4, Lucide Icons, react-markdown, remark-gfm           │
│  - Kartogramy SVG Małopolski, wykresy analityczne, symulator wad wzroku│
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ REST API (JSON)
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                   WARSTWA LOGIKI BIZNESOWEJ (FastAPI)                  │
│  - Python 3.10+ / FastAPI / Pydantic v2 / Uvicorn                      │
│  - Sentence-Transformers (all-MiniLM-L6-v2, 384 dim)                   │
│  - Moduły: login, ideas, matching, chat, innovations, indicators,      │
│    notifications, middleman, idea_creator                              │
└───────────────────┬────────────────────────────────┬───────────────────┘
                    │                                │
                    ▼                                ▼
┌──────────────────────────────────────┐  ┌──────────────────────────────┐
│       BAZA RELACYJNA I WEKTOROWA     │  │       INFERENCJA AI (RAG)    │
│  Supabase (PostgreSQL 16 + pgvector) │  │  Groq Cloud LPU               │
│  - 115 innowacji (embedding vector)  │  │  - LLaMA 3.3 70B Versatile   │
│  - 1 188 pomiarów statystycznych GUS │  │  - Czas odpowiedzi: < 1.2s   │
│  - Fallback in-memory w Pythonie     │  │  - Guardrails i filtr 5%     │
└──────────────────────────────────────┘  └──────────────────────────────┘
```

### Stos Technologiczny:
* **Frontend:** Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS v4, Lucide React.
* **Backend:** Python 3.10+, FastAPI, Pydantic, PyJWT, Bcrypt, HTTPX.
* **AI & NLP:** Groq Cloud LPU (LLaMA 3.3 70B Versatile, Qwen), `sentence-transformers` (`all-MiniLM-L6-v2`).
* **Baza Danych:** Supabase / PostgreSQL 16 z rozszerzeniem `pgvector` (384 wymiary) + wbudowany silnik awaryjny in-memory.
* **Mobile:** Expo / React Native, TypeScript.

---

## 🗄️ Baza Danych i Zasoby Informacyjne

Schemat bazy danych ([backend/supabase_schema.sql](file:///c:/Users/fabia/hubmi/backend/supabase_schema.sql)) obejmuje kluczowe relacje:

| Tabela | Liczba rekordów / Opis | Kluczowe kolumny |
| :--- | :--- | :--- |
| **`innovations`** | 115 rekordów | `id`, `title`, `description`, `target_audience`, `problems_solved`, `grant_amount`, `embedding vector(384)` |
| **`indicators`** | 17 definicji wskaźników | `id`, `name`, `category`, `unit`, `description`, `trend` |
| **`indicator_measurements`** | 1 188 punktów pomiarowych | `indicator_id`, `powiat_name`, `year` (2014–2024), `val` |
| **`users`** | Profile użytkowników | `id`, `email`, `password_hash`, `full_name`, `role` (`user`, `admin`, `expert`) |
| **`ideas`** | Oddolne pomysły | `id`, `title`, `description`, `category`, `user_id`, `stage`, `image_url` |
| **`reactions`** | Głosy mieszkańców | `idea_id`, `user_id`, `reaction_type` (`like`, `volunteer`, `dislike`) |
| **`chat_conversations`** | Wątki konsultacyjne | `id`, `user_id`, `subject`, `status` (`open`, `in_progress`, `closed`) |
| **`chat_messages`** | Wiadomości czatu | `conversation_id`, `sender_id`, `sender_role`, `message`, `created_at` |

---

## 🚀 Przewodnik po REST API (Swagger & OpenAPI)

Po uruchomieniu backendu pełna interaktywna dokumentacja dostępna jest pod adresem:  
👉 **`http://127.0.0.1:8000/docs`** (Swagger UI)  
👉 **`http://127.0.0.1:8000/openapi.json`** (OpenAPI v3)

### Wybrane Endpointy API:

#### 1. Innowacje Społeczne (`/api/innovations`)
* `GET /api/innovations` – pobranie listy innowacji z opcjonalnym wyszukiwaniem i stronicowaniem.
* `GET /api/innovations/{id}` – szczegółowe dane pojedynczej innowacji.
* `GET /api/innovations/all` – pełny zrzut bazy innowacji wraz z wektorami embeddingów.

#### 2. Doradca RAG i Matching Semantyczny (`/api/matching`)
* `POST /api/matching/chat` – zapytanie semantyczne: wektoryzacja, filtr 5%, guardrails, synteza Groq AI i tracing czasu wykonania.

#### 3. Middleman Innowacji dla Instytucji (`/api/middleman`)
* `POST /api/middleman/adapt` – przekształcenie innowacji w kompletną kartę usługi CUS/OPS (zasoby, budżet, KPI, ryzyka).
* `POST /api/middleman/refine` – iteracyjne dostosowanie karty według wytycznych urzędnika (np. cięcie kosztów, brak personelu).

#### 4. Wskaźniki i Kartogramy Powiatowe (`/api/indicators`)
* `GET /api/indicators` – dane statystyczne 22 powiatów z lat 2014–2024 (z cache 30s).
* `GET /api/indicators/categories` – kategorie wskaźników z przypisanymi barwami i ikonami.
* `POST /api/indicators/rag` – analityczny RAG łączący dane GUS/ROPS z innowacjami.

#### 5. Kreator Pomysłów AI (`/api/idea-creator`)
* `POST /api/idea-creator/assistant/chat` – wieloetapowy asystent dopracowujący pomysł mieszkańca.
* `POST /api/idea-creator/projects` – publikacja dopracowanego projektu do bazy pomysłów.

#### 6. Komunikator z Ekspertami (`/api/chat`)
* `GET /api/chat/conversations` – lista wątków użytkownika lub panel wszystkich spraw dla ROPS.
* `POST /api/chat/conversations` – utworzenie nowego zgłoszenia.
* `GET /api/chat/conversations/{id}/messages` – polling wiadomości (`since` / `after_id`).
* `POST /api/chat/conversations/{id}/messages` – wysłanie wiadomości.
* `PATCH /api/chat/conversations/{id}/status` – zmiana statusu sprawy (`open`, `in_progress`, `closed`).

#### 7. Społeczność i Pomysły (`/api/ideas`)
* `GET /api/ideas/` – lista pomysłów z agregacją reakcji społeczności.
* `POST /api/ideas/{id}/react` – dodanie lub zmiana reakcji (`like`, `volunteer`, `dislike`).

#### 8. Uwierzytelnianie (`/api/login`)
* `POST /api/login/user` – logowanie mieszkańca / wnioskodawcy.
* `POST /api/login/admin` – logowanie pracownika ROPS / administratora.
* `POST /api/login/register` – rejestracja nowego konta.
* `GET /api/login/me` – dane aktywnego profilu (JWT Bearer).

---

## 🔑 Konta Testowe i Dostęp Demonstracyjny

Dla wygody komisji konkursowej i testerów przygotowano gotowe konta testowe:

| Rola | E-mail | Hasło | Uprawnienia i dostęp |
| :--- | :--- | :--- | :--- |
| **Administrator (ROPS Kraków)** | `test@gmail.com` | `test123` | Dostęp do panelu `/admin`, moderacji pomysłów, wszystkich wątków czatu oraz zarządzania naborami |
| **Użytkownik / Mieszkaniec** | `user@hubmi.pl` | `user123` | Zgłaszanie innowacji w `/propose`, głosowanie na pomysły, czat z doradcą, testowanie innowacji |

*(Możliwa jest również natychmiastowa rejestracja dowolnego nowego konta przez formularz rejestracji).*

---

## 💻 Szybkie Uruchomienie (Instrukcja Krok po Kroku)

### Metoda 1: Automatyczny start jednym kliknięciem (Windows)
W głównym katalogu projektu uruchom skrypt PowerShell:
```powershell
.\start_all.ps1
```
lub w klasycznym wierszu poleceń (cmd):
```cmd
start.bat
```
Skrypt automatycznie uruchamia backend FastAPI (port 8000) oraz frontend Next.js (port 3000) w osobnych oknach terminala.

---

### Metoda 2: Uruchomienie ręczne

#### Krok 1: Backend (FastAPI)
```powershell
cd c:\Users\fabia\hubmi\backend

# Opcjonalnie: aktywacja wirtualnego środowiska Python
python -m venv .venv
.\.venv\Scripts\activate

# Instalacja zależności
pip install -r requirements.txt

# Uruchomienie serwera API
python -m uvicorn main:app --reload --port 8000
```
Backend jest dostępny pod adresem: `http://127.0.0.1:8000`  
Dokumentacja Swagger: `http://127.0.0.1:8000/docs`

#### Krok 2: Frontend (Next.js)
```powershell
cd c:\Users\fabia\hubmi\front

# Instalacja pakietów npm
npm install

# Uruchomienie serwera deweloperskiego
npm run dev
```
Aplikacja internetowa dostępna jest pod adresem: `http://localhost:3000`

#### Krok 3: Aplikacja Mobilna (Expo – opcjonalnie)
```powershell
cd c:\Users\fabia\hubmi\front-mobile
npm install
npx expo start
```

---

## ♿ Dostępność Cyfrowa (WCAG 2.2) i Bezpieczeństwo

* **Zgodność z Ustawą o Dostępności Cyfrowej (Dz.U. 2019 poz. 848):**
  * Projektowany od fundamentów pod wytyczne **WCAG 2.2 (poziom AA i kluczowe kryteria AAA)**.
  * Pełne wsparcie dla czytników ekranu (aria-label, semantyczne tagi HTML5, skip-linki).
  * Wysoki współczynnik kontrastu barw oraz natywny **tryb wysokiego kontrastu**.
* **Bezpieczeństwo i Ochrona Danych (RODO):**
  * Bezpieczne hashowanie haseł przy użyciu **bcrypt**.
  * Bezstanowa autoryzacja za pomocą tokenów **JWT (JSON Web Token)** z sygnaturą HS256.
  * Row Level Security (RLS) na poziomie bazy danych PostgreSQL.
  * Ochrona przed prompt injection i atakami off-topic w silniku RAG dzięki filtrom **Guardrails**.

---

## 💰 Kosztorys i Utrzymanie (TCO)

Projekt został zaprojektowany w filozofii **Frugal Engineering** – zero zbędnych, drogich licencji korporacyjnych.

| Parametr | Wariant Chmurowy (Cloud) | Wariant Urzędowy (On-Premise) |
| :--- | :---: | :---: |
| **Miesięczny koszt infrastruktury** | **~340 do ~560 PLN brutto** | **0 PLN opłat abonamentowych** |
| **Roczny koszt infrastruktury** | **~4 100 do ~6 700 PLN brutto** | **0 PLN opłat abonamentowych** |
| **Technologia bazy danych** | Supabase Pro (Postgres + pgvector) | Self-hosted PostgreSQL + pgvector |
| **Modele AI** | Groq LPU (LLaMA 3.3 70B, ~$0.59/1M tok.) | vLLM / Ollama (np. Bielik-11B na GPU) |

Kompletny, oficjalny dokument formalny z pełnym rozbiciem pozycji kosztowych i opisem zasobów kadrowych znajduje się w pliku:  
👉 **[KOSZTY_I_ZASOBY.md](file:///c:/Users/fabia/hubmi/KOSZTY_I_ZASOBY.md)**

---

## 🏆 Materiały Konkursowe i Prezentacyjne

Szczegółowy plan wystąpienia przed jury, pitch deck slajd po slajdzie oraz kompletny scenariusz nagrania wideo demonstracyjnego (z czasem i skryptem lektorskim) znajdują się w pliku:  
👉 **[PREZENTACJA_I_PLAN_WIDEO.md](file:///c:/Users/fabia/hubmi/PREZENTACJA_I_PLAN_WIDEO.md)**

---
*Hubmi (MiNNO) – Zbudowane z pasją dla Małopolski i ROPS Kraków.*
