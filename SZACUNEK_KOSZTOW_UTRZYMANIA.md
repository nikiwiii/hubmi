# Hubmi — koszty technicznego utrzymania

**Szacunek na 4 października 2026 r. | Kwoty netto**

Dla **10 000 odwiedzających miesięcznie** przewidywany koszt technicznego utrzymania strony w wariancie oszczędnym wynosi **47–80 zł miesięcznie**, czyli **564–960 zł rocznie**.

## Koszty zależnie od liczby odwiedzających

| Koszt | 1 000 osób/mies. | 10 000 osób/mies. | 50 000 osób/mies. | 200 000 osób/mies. |
| --- | ---: | ---: | ---: | ---: |
| Serwer strony i zaplecza | 40–50 zł | 40–60 zł | 80–120 zł | 150–250 zł |
| Baza danych i przechowywanie plików | 0 zł* | 0 zł* | 100 zł | 100–140 zł |
| Asystent tekstowy AI | 0–2 zł | 2–5 zł | 15–25 zł | 60–90 zł |
| Kopie zapasowe i drobne dodatki | 5–10 zł | 5–15 zł | 10–20 zł | 20–40 zł |
| **Łącznie miesięcznie** | **45–62 zł** | **47–80 zł** | **205–265 zł** | **330–520 zł** |
| **Łącznie rocznie** | **540–744 zł** | **564–960 zł** | **2 460–3 180 zł** | **3 960–6 240 zł** |

\* Darmowa baza jest dostępna w limitach planu Supabase Free: 500 MB danych, 1 GB plików i ograniczony transfer. Po przekroczeniu limitów należy doliczyć około **100 zł miesięcznie** za plan Pro. Plan Free wymaga własnych kopii zapasowych i może zostać wstrzymany po tygodniu bezczynności.

## Niezbędne zasoby

- **Serwer internetowy** — wspólne miejsce działania strony i jej zaplecza; na start około 4 rdzeni procesora, 8 GB pamięci i 80 GB dysku.
- **Baza danych i miejsce na pliki** — konta, pomysły, wiadomości i dokumenty przechowywane w Supabase.
- **Usługa AI** — Groq, rozliczany według wykorzystania, z ograniczeniem liczby i długości odpowiedzi.
- **Domena, poczta i zabezpieczenie HTTPS** — wykorzystanie istniejącej domeny i poczty klienta oraz bezpłatnego certyfikatu.
- **Kopie zapasowe i monitoring** — kopie danych i plików poza głównym serwerem oraz podstawowe alerty o awarii.

## Założenia wyceny

Wariant zakłada głównie przeglądanie strony: średnio 2 wizyty po 5 podstron na osobę miesięcznie oraz 5% odwiedzających korzystających z AI po 2 wywołania. Generowanie obrazów AI jest wyłączone. Domena i poczta klienta nie wymagają nowego abonamentu.

Kwoty dotyczą wyłącznie infrastruktury i usług technicznych. Nie obejmują wdrożenia, obsługi serwisowej ani aplikacji mobilnej. Są szacunkiem dla proponowanej konfiguracji oszczędnej; większa liczba jednoczesnych użytkowników, plików lub zapytań AI może zwiększyć koszt. Rok oznacza 12 miesięcy przy stałym poziomie ruchu.

Podstawa cenowa: [Hetzner](https://docs.hetzner.com/general/infrastructure-and-availability/price-adjustment/), [Supabase](https://supabase.com/pricing), [Groq](https://console.groq.com/docs/models). Przeliczniki planistyczne: 1 EUR = 4,30 zł; 1 USD = 4 zł.
