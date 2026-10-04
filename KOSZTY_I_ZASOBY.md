# 💰 Kosztorys Utrzymania i Opis Niezbędnych Zasobów (TCO)
## Projekt: Hubmi – Cyfrowe Serce Małopolskiego Hubu Innowacji Społecznych
**Instytucja docelowa:** Regionalny Ośrodek Polityki Społecznej w Krakowie (ROPS Kraków)  
**Wyzwanie:** *Zaprojektuj inteligentne narzędzie wspierające rozwój Małopolskiego Hubu Innowacji Społecznych*  
**Data opracowania:** Październik 2026 | HackYeah 2026  

---

## 1. Podsumowanie Menedżerskie (Executive Summary)

Projekt **Hubmi** został od podstaw zaprojektowany zgodnie z paradygmatem **wysokiej efektywności kosztowej (Frugal Engineering)** oraz **maksymalnego wykorzystania technologii Open Source**. Wyeliminowano konieczność zakupu drogich licencji korporacyjnych (np. dedykowanych platform enterprise, komercyjnych baz wektorowych z opłatami per seat czy zamkniętych modeli językowych z wysokim narzutem).

### Kluczowe wnioski finansowe:
- **Miesięczny koszt utrzymania infrastruktury chmurowej (Cloud):** od **~340 PLN do ~560 PLN brutto** (~80 - 130 EUR/mc).
- **Roczny koszt infrastruktury (TCO Chmury):** od **~4 100 PLN do ~6 700 PLN brutto**, co stanowi ułamek tradycyjnego budżetu IT instytucji publicznej.
- **Wariant Alternatywny (On-Premise / Suwerenność danych w serwerowni Urzędu Marszałkowskiego):** **0 PLN** kosztów licencji chmurowych (100% Open Source: self-hosted PostgreSQL z rozszerzeniem `pgvector`, kontenery Docker i lokalne modele LLM).
- **Zwrot z inwestycji (ROI):** Automatyzacja matchmakingu, generowania kart usług (Middleman) i raportowania RAG oszczędza szacunkowo **60–80 roboczogodzin miesięcznie** zespołu ROPS Kraków.

---

## 2. Architektura Techniczna a Efektywność Kosztowa

Wybór stosu technologicznego bezpośrednio przekłada się na niskie koszty eksploatacji:

```
┌────────────────────────────────────────────────────────────────────────┐
│                        UŻYTKOWNIK KOŃCOWY                              │
│       (Mieszkańcy, JST, Centra Usług Społecznych, NGO, Eksperci)       │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ HTTPS / WCAG 2.1 AA
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│               WARSTWA PREZENTACJI (Next.js 16 + React 19)              │
│  - Hosting na Vercel Pro lub Cloudflare Pages (darmowy/tani tier)      │
│  - Serwowanie statyczne (SSG/ISR), CDN edge caching dla wykresów i map │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ REST API / JSON
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                   WARSTWA LOGIKI BIZNESOWEJ (FastAPI)                  │
│  - Bezstanowy mikroserwis Python 3.11+ na lekkim VPS / kontenerze      │
│  - Wbudowany cache in-memory wskaźników statystycznych (zero zbędnych  │
│    zapytań do bazy)                                                    │
└───────────────────┬────────────────────────────────┬───────────────────┘
                    │                                │
                    ▼                                ▼
┌──────────────────────────────────────┐  ┌──────────────────────────────┐
│       BAZA RELACYJNA I WEKTOROWA     │  │       INFERENCJA AI (RAG)    │
│  Supabase (PostgreSQL 16 + pgvector) │  │  Groq LPU (LLaMA 3.3 / Qwen) │
│  - 115 innowacji + 1188 pomiarów GUS │  │  - Ultraszybki czas < 1.2s   │
│  - Natywny indeks HNSW vector(384)   │  │  - Koszt: ~$0.59 / 1M tokenów│
│  - Row Level Security (RLS)          │  │  - Guardrails i filtr 5%     │
└──────────────────────────────────────┘  └──────────────────────────────┘
```

---

## 3. Szczegółowy Kosztorys Infrastruktury (Tabela TCO)

Poniższa kalkulacja przedstawia koszty dla docelowej skali operacyjnej w Małopolsce (szacunek: 20 000 odwiedzin miesięcznie, 3 000 zapytań RAG, 200 nowych pomysłów i zgłoszeń testerów miesięcznie).

### Wariant Rekomendowany: Hybrydowa Chmura Zarządzana (Managed Cloud)

| Komponent / Usługa | Dostawca / Rozwiązanie | Specyfikacja / Plan | Koszt miesięczny (PLN netto) | Koszt roczny (PLN netto) |
| :--- | :--- | :--- | :---: | :---: |
| **Aplikacja WWW (Frontend)** | Vercel / Cloudflare | Plan Pro (Vercel) lub Cloudflare Pages + Edge Network (nielimitowany transfer, ochrona DDoS) | 80 PLN | 960 PLN |
| **Serwer API (Backend)** | OVH Cloud / Hetzner Cloud (Centrum danych: PL / DE) | VPS 4 vCPU, 8 GB RAM, 80 GB NVMe SSD, łącze 1 Gbps, automatyczne snapshoty | 65 PLN | 780 PLN |
| **Baza danych & pgvector** | Supabase Pro | Dedykowana instancja Postgres, 8 GB pamięci na dane, codzienne backupy, szyfrowanie at-rest | 100 PLN | 1 200 PLN |
| **Silnik RAG & LLM** | Groq Cloud API | ~3 000 zapytań miesięcznie x 1 200 tokenów = ~3.6M tokenów (model LLaMA 3.3 70B Versatile, ~$0.59 / 1M tokenów) | 12 PLN | 144 PLN |
| **Generowanie Wizualizacji (Kreator Pomysłów)** | Pollinations / Fal.ai | Generowanie miniatur prototypów innowacji (~300 grafik/mc) | 25 PLN | 300 PLN |
| **Domena regionalna & Certyfikaty SSL** | NASK / Let's Encrypt | Domena `hubmi.malopolska.pl` (subdomena województwa = 0 zł) lub dedykowana `.pl` | 10 PLN | 120 PLN |
| **Monitoring & Alerty** | Sentry + UptimeRobot | Plan Developer / Open Source (monitoring błędów i dostępności 24/7) | 0 PLN *(free tier)* | 0 PLN |
| **Transakcyjna poczta E-mail** | Resend / SendGrid | Powiadomienia o naborach, zgłoszeniach testerów i odpowiedziach ROPS (do 3 000 e-maili/mc) | 0 PLN *(free tier)* | 0 PLN |
| **SUMA (Infrastruktura):** | | | **~292 PLN netto**<br>*(~359 PLN brutto)* | **~3 504 PLN netto**<br>*(~4 310 PLN brutto)* |

---

### Wariant Alternatywny: Pełna Suwerenność Danych (On-Premise ROPS / UMWM)

W przypadku wymogu instalacji w zamkniętym środowisku Urzędu Marszałkowskiego Województwa Małopolskiego:
- **Baza danych:** Samodzielnie hostowany PostgreSQL z rozszerzeniem `pgvector` na maszynie wirtualnej województwa: **0 PLN opłat abonamentowych**.
- **Frontend i Backend:** Konteneryzacja Docker Compose / Kubernetes (K8s) w klastrze urzędowym: **0 PLN opłat abonamentowych**.
- **Modele Językowe:** Lokalne serwowanie modeli (np. polski model *Bielik-11B* lub *LLaMA 3.1 8B*) za pomocą `vLLM` / `Ollama` na istniejącym serwerze z GPU (np. pojedyncza karta NVIDIA RTX 4090 lub A4000): **0 PLN kosztów API**.
- **Łączny koszt licencji komercyjnych wariantu On-Premise:** **0 PLN / rok**.

---

## 4. Opis Niezbędnych Zasobów Ludzkich i Organizacyjnych

System Hubmi eliminuje rutynową biurokrację, dzięki czemu nie wymaga tworzenia rozbudowanych nowych etatów informatycznych w ROPS Kraków. Obsługa opiera się na istniejącej strukturze organizacyjnej:

### A. Zasoby Merytoryczne (ROPS Kraków)

1. **Koordynator Małopolskiego Hubu Innowacji Społecznych (0.25 – 0.5 FTE):**
   - **Rola:** Administrator merytoryczny panelu `/admin`.
   - **Obowiązki:**
     - Przegląd i zatwierdzanie fiszek innowacji zgłaszanych przez mieszkańców i NGO.
     - Weryfikacja wniosków mieszkańców o status testera innowacji w module `/testing`.
     - Monitorowanie pulpitu trendów potrzeb społecznych (zagregowane deficyty z 22 powiatów).
     - Aktywacja nowych naborów grantowych w generatorze wniosków.
   - **Wymagane kompetencje:** Podstawowa obsługa przeglądarki internetowej i panelu CMS (brak wymogu wiedzy technicznej).

2. **Konsultanci i Mentorzy Branżowi ROPS (ok. 2–4 godziny tygodniowo w ramach obowiązków):**
   - **Rola:** Eksperci odpowiadający w komunikatorze `/chat` oraz konsultujący Karty Usług generowane w module `/middleman`.
   - **Obowiązki:** Bezpośredni dialog z autorami innowacji, doradztwo w kwestiach dostępności i skalowania.
   - **Wsparcie AI:** Asystent RAG przygotowuje wstępne konteksty i dane analityczne, skracając czas odpowiedzi eksperta z 45 minut do 5 minut.

---

### B. Zasoby Techniczne i Utrzymanie IT (DevOps & Wsparcie)

1. **Wsparcie Techniczne (SLA / Maintenance):**
   - **Zapotrzebowanie:** Średnio **8–15 godzin miesięcznie** (wsparcie 3 linii).
   - **Zakres zadań:**
     - Bieżące aktualizacje bibliotek bezpieczeństwa (FastAPI, Next.js, Python dependencies).
     - Weryfikacja integralności kopii zapasowych bazy danych Supabase.
     - Monitoring limitów API i czasu odpowiedzi serwerów.
     - Roczne odświeżenie danych statystycznych GUS (skrypt `seed_indicators.py` – 1 godzina pracy raz w roku).
   - **Forma realizacji:** Wewnętrzny wydział IT Urzędu Marszałkowskiego Województwa Małopolskiego LUB ryczałtowa umowa serwisowa z wykonawcą (szacunkowo 1 500 – 2 500 PLN netto/mc).

---

## 5. Zgodność z Wymogami Prawnymi, Bezpieczeństwem i Standardami

| Obszar | Sposób realizacji w Hubmi | Wpływ na koszty |
| :--- | :--- | :--- |
| **WCAG 2.1 Poziom AA** | Architektura oparta na semantycznym HTML5, obsłudze klawiatury, kontrastach WCAG AAA oraz wbudowanym czytniku Web Speech API i dyktowaniu głosowym. | **0 PLN dodatkowych licencji** – brak potrzeby zakupu zewnętrznych widgetów dostępności (np. UserWay), które generują koszty abonamentowe. |
| **RODO i Ochrona Danych** | Separacja danych: brak przetwarzania danych medycznych i wrażliwych. Wektoryzacji podlegają wyłącznie jawne opisy wyzwań i innowacji. Serwery zlokalizowane w Europejskim Obszarze Gospodarczym (Frankfurt / Warszawa). | Brak ryzyka kar i kosztownych audytów cross-border. |
| **Architektura Bezstanowa (Stateless API)** | Backend FastAPI nie przechowuje stanu sesji w pamięci maszynowej (tokeny JWT). Umożliwia to natychmiastowe skalowanie horyzontalne (dokładanie instancji kontenera przy skokach ruchu). | Płacimy tylko za faktycznie wykorzystane zasoby, brak kosztów nadmiarowej infrastruktury. |

---

## 6. Harmonogram i Etapy Wdrożenia (Roadmap do Produkcji)

Projekt posiada w pełni działający prototyp (MVP) z kompletem 7 modułów. Wdrożenie produkcyjne może nastąpić w ciągu **8 tygodni**:

```
Tydzień 1-2: Środowisko Staging & Bezpieczeństwo
├── Konfiguracja produkcyjnej bazy PostgreSQL (Supabase / on-premise)
├── Uruchomienie skryptów migracji DDL (supabase_schema.sql)
└── Testy penetracyjne API i audyt RODO

Tydzień 3-4: Integracja Regionalna & Domena
├── Podpięcie pod regionalną subdomenę (np. innowacje.malopolska.pl)
├── Weryfikacja dostępności cyfrowej z udziałem testerów z niepełnosprawnościami (WCAG AA)
└── Integracja z katalogiem ekspertów ROPS Kraków

Tydzień 5-6: Szkolenie Kadry ROPS
├── Przekazanie panelu administratora (/admin) pracownikom Hubu
├── Szkolenie z obsługi naborów grantowych i moderacji testerów
└── Pilotaż z wybraną grupą 3 lokalnych Centrów Usług Społecznych (CUS)

Tydzień 7-8: Oficjalny Start Produkcyjny
├── Kampania informacyjna dla mieszkańców i NGO Małopolski
└── Uruchomienie bieżącego monitoringu trendów potrzeb regionalnych
```

---

## 7. Podsumowanie Wskaźników Efektywności (ROI)

| Tradycyjny proces ROPS | Proces wspierany przez platformę Hubmi | Oszczędność / Wartość dodana |
| :--- | :--- | :--- |
| Ręczne przeszukiwanie katalogu 200 innowacji przez urzędnika (czas: 2–4 godziny na zapytanie). | **Matchmaking RAG (AI):** natychmiastowe dopasowanie w czasie < 1.5 sekundy z uzasadnieniem merytorycznym. | **Oszczędność ~95% czasu** na etapie wstępnej diagnozy problemu. |
| Adaptacja innowacji do specyfiki gminy wymaga wielodniowych konsultacji i pisania ekspertyz. | **Middleman Innowacji:** automatyczne wygenerowanie Karty Usługi dopasowanej do budżetu i kadry danej JST w 30 sekund. | Drastyczne obniżenie progu wejścia dla małych gmin wiejskich. |
| Papierowe formularze naboru testerów i arkusze Excel. | **Moduł Testera:** cyfrowy obieg zgłoszeń, automatyczna ankieta kryteriów i moderacja 1 kliknięciem. | Przejrzystość procesu i natychmiastowy feedback od obywateli. |

> **Podsumowanie:** Hubmi to rozwiązanie **gotowe do natychmiastowej instalacji**, które przy minimalnym nakładzie finansowym (od 350 zł/mc) dostarcza zaawansowaną technologicznie platformę klasy regionalnej, spełniającą wszystkie kryteria formalne i merytoryczne konkursu.
