"""
Skrypt do generowania i aktualizowania wektorów embeddingów w tabeli 'innovations' w bazie Supabase.
Embedding jest tworzony z sumy/połączenia tekstów pól:
description + addressed_problems + target_group + beneficiaries + validation + authors

Uruchomienie:
    cd backend
    python update_innovations_embeddings.py
    (lub z flagą --only-missing: python update_innovations_embeddings.py --only-missing)
"""

import sys
import os
import io
import time
import argparse
from typing import List, Dict, Any

# Zapewnienie kodowania UTF-8 na konsoli Windows
if sys.stdout.encoding != "utf-8":
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8", errors="replace")

# Dodaj bieżący katalog do ścieżki Pythona
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from dotenv import load_dotenv
load_dotenv()

from supabase_client import supabase_client, is_supabase_connected
from matching.embeddings import compute_embedding


def build_combined_text(row: Dict[str, Any]) -> str:
    """
    Łączy wymagane pola tekstowe w jeden spójny ciąg dla modelu embeddingów:
    description + addressed_problems + target_group + beneficiaries + validation + authors
    """
    # Obsługa potencjalnych alternatywnych literówek w nazwach kolumn
    description = (row.get("description") or "").strip()
    addressed_problems = (row.get("addressed_problems") or row.get("addresed_problems") or "").strip()
    target_group = (row.get("target_group") or "").strip()
    beneficiaries = (row.get("beneficiaries") or row.get("beneficiares") or "").strip()
    validation = (row.get("validation") or "").strip()
    authors = (row.get("authors") or "").strip()

    parts: List[str] = []
    if description:
        parts.append(f"Opis: {description}")
    if addressed_problems:
        parts.append(f"Rozwiazywane problemy: {addressed_problems}")
    if target_group:
        parts.append(f"Grupa docelowa: {target_group}")
    if beneficiaries:
        parts.append(f"Beneficjenci: {beneficiaries}")
    if validation:
        parts.append(f"Walidacja: {validation}")
    if authors:
        parts.append(f"Autorzy: {authors}")

    combined = " ".join(parts).strip()
    # Jeśli wszystkie te pola były puste, użyj tytułu
    if not combined:
        combined = (row.get("title") or "Innowacja").strip()
    return combined


def update_embeddings(only_missing: bool = False):
    if not is_supabase_connected or not supabase_client:
        print("[!] Blad: Brak polaczenia z Supabase. Sprawdz SUPABASE_URL i SUPABASE_KEY w pliku .env.")
        sys.exit(1)

    print("=" * 70)
    print("ROZPOCZECIE AKTUALIZACJI EMBEDDINGOW W TABELI 'innovations'")
    print(f"Tryb: {'Tylko brakujace (NULL)' if only_missing else 'Wszystkie rekordy'}")
    print("Zrodlo embeddingu: description + addressed_problems + target_group + beneficiaries + validation + authors")
    print("=" * 70)

    # 1. Pobierz rekordy z bazy Supabase
    try:
        query = supabase_client.table("innovations").select("*")
        if only_missing:
            query = query.is_("embedding", "null")
        res = query.execute()
        rows: List[Dict[str, Any]] = res.data or []
    except Exception as e:
        print(f"[!] Blad podczas pobierania rekordow z Supabase: {e}")
        sys.exit(1)

    total = len(rows)
    if total == 0:
        print("[i] Brak rekordow wymagajacych aktualizacji embeddingu.")
        return

    print(f"[*] Znaleziono {total} rekordow w bazie do przetworzenia.\n")

    success_count = 0
    error_count = 0
    start_time = time.time()

    for idx, row in enumerate(rows, 1):
        row_id = row.get("id")
        title = (row.get("title") or "Bez tytulu")[:45]

        # Polacz teksty
        text_to_embed = build_combined_text(row)

        try:
            # Oblicz embedding
            vector = compute_embedding(text_to_embed)

            # Zaktualizuj rekord w tabeli innovations w Supabase
            up_res = supabase_client.table("innovations").update({
                "embedding": vector
            }).eq("id", row_id).execute()

            if up_res.data:
                success_count += 1
                progress = f"[{idx}/{total}]"
                print(f"[OK] {progress:<10} ID: {row_id} | {title}...")
            else:
                error_count += 1
                print(f"[WARN] [{idx}/{total}] Nie udalo sie zaktualizowac ID: {row_id}")
        except Exception as e:
            error_count += 1
            print(f"[ERR] [{idx}/{total}] Blad dla ID {row_id}: {e}")

        # Optymalizacja polaczenia z API Supabase
        if idx % 10 == 0:
            time.sleep(0.05)

    elapsed = round(time.time() - start_time, 2)
    print("\n" + "=" * 70)
    print("ZAKONCZONO PROCES AKTUALIZACJI EMBEDDINGOW W SUPABASE")
    print(f"Czas wykonania: {elapsed} s")
    print(f"Pomyslnie zaktualizowano: {success_count}/{total}")
    if error_count > 0:
        print(f"Liczba bledow: {error_count}")
    print("=" * 70)


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Aktualizacja kolumny embedding w tabeli innovations w bazie Supabase.")
    parser.add_argument(
        "--only-missing",
        action="store_true",
        help="Aktualizuj tylko rekordy, gdzie embedding jest NULL"
    )
    args = parser.parse_args()

    update_embeddings(only_missing=args.only_missing)
