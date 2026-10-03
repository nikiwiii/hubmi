import os
import sys
import json
import logging
import argparse
from pathlib import Path
import requests
from dotenv import load_dotenv

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("seed_innovations")

def get_paths():
    base_dir = Path(__file__).resolve().parent
    env_path = base_dir / ".env"
    if not env_path.exists():
        env_path = base_dir / ".env.example"
    if not env_path.exists():
        env_path = Path(".env")
    if not env_path.exists():
        env_path = Path(".env.example")
        
    data_json_path = base_dir.parent / "front" / "data.json"
    if not data_json_path.exists():
        data_json_path = Path("front/data.json")
        
    return env_path, data_json_path

def load_config():
    env_path, data_json_path = get_paths()
    if env_path.exists():
        load_dotenv(dotenv_path=env_path)
        logger.info(f"Loaded config: {env_path.name}")
    else:
        load_dotenv()
        logger.warning("No .env or .env.example found; using environment variables.")

    supabase_url = os.getenv("SUPABASE_URL", "").strip()
    supabase_key = (
        os.getenv("SUPABASE_SERVICE_ROLE_KEY", "").strip()
        or os.getenv("SUPABASE_KEY", "").strip()
    )

    if not supabase_url or not supabase_key:
        logger.error("Missing SUPABASE_URL or SUPABASE_KEY in config")
        sys.exit(1)

    clean_url = supabase_url.rstrip("/")
    rest_url = clean_url if clean_url.endswith("/rest/v1") else f"{clean_url}/rest/v1"
    return rest_url, supabase_key, data_json_path

def load_data(data_json_path: Path, limit: int = None):
    if not data_json_path.exists():
        logger.error(f"File not found: {data_json_path}")
        sys.exit(1)

    with open(data_json_path, "r", encoding="utf-8") as f:
        data = json.load(f)

    innovations = []
    if isinstance(data, dict):
        for url, items in data.items():
            cat = url.rstrip("/").split("/")[-1]
            if isinstance(items, list):
                for item in items:
                    item_copy = dict(item)
                    if "category" not in item_copy:
                        item_copy["category"] = cat
                    if "url" not in item_copy:
                        item_copy["url"] = url
                    innovations.append(item_copy)
    elif isinstance(data, list):
        innovations = data

    if limit and limit > 0:
        innovations = innovations[:limit]

    logger.info(f"Loaded {len(innovations)} records from {data_json_path.name}")
    return innovations

def map_item(item: dict, include_category: bool = True, include_url: bool = True, truncate: bool = False) -> dict:
    title = item.get("name") or item.get("title") or "Untitled"
    description = item.get("solution_description") or item.get("description") or ""
    addressed_problems = item.get("problem_concern") or item.get("addressed_problems")
    target_group = item.get("target_group")
    beneficiaries = item.get("user_target") or item.get("beneficiaries")
    validation = item.get("solution_implementation") or item.get("validation")
    authors = item.get("authors")
    category = item.get("category")
    url = item.get("url")

    if truncate:
        if title and len(title) > 255:
            title = title[:252] + "..."
        if target_group and len(target_group) > 255:
            target_group = target_group[:252] + "..."
        if beneficiaries and len(beneficiaries) > 255:
            beneficiaries = beneficiaries[:252] + "..."
        if authors and len(authors) > 255:
            authors = authors[:252] + "..."
        if url and len(url) > 255:
            url = url[:255]

    record = {
        "title": title,
        "description": description,
        "addressed_problems": addressed_problems,
        "target_group": target_group,
        "beneficiaries": beneficiaries,
        "validation": validation,
        "authors": authors
    }

    if include_url and url:
        record["url"] = url

    if include_category and category:
        record["category"] = category

    return record

def check_column(rest_url: str, headers: dict, column_name: str) -> bool:
    try:
        r = requests.get(f"{rest_url}/innovations?select={column_name}&limit=1", headers=headers)
        return r.status_code == 200
    except Exception:
        return False

def upload_records(rest_url: str, api_key: str, innovations: list, batch_size: int = 20, dry_run: bool = False, clear_first: bool = False):
    headers = {
        "apikey": api_key,
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json",
        "Prefer": "return=minimal"
    }

    has_cat = check_column(rest_url, headers, "category")
    has_url = check_column(rest_url, headers, "url")
    logger.info(f"Category column: {'present' if has_cat else 'not found (omitted)'}")
    logger.info(f"URL column: {'present' if has_url else 'not found (omitted)'}")

    records = [map_item(it, include_category=has_cat, include_url=has_url) for it in innovations]

    if dry_run:
        logger.info(f"[DRY-RUN] Validated {len(records)} records. No changes written to database.")
        sample = records[0] if records else {}
        logger.info(f"[DRY-RUN] Sample record keys: {list(sample.keys())}")
        logger.info(f"[DRY-RUN] Sample title: {sample.get('title')}")
        logger.info(f"[DRY-RUN] Sample url: {sample.get('url')}")
        return True

    if clear_first:
        logger.info("Clearing existing records in innovations table...")
        del_res = requests.delete(f"{rest_url}/innovations?id=not.is.null", headers=headers)
        if del_res.status_code in (200, 204):
            logger.info("Cleared existing records.")
        else:
            logger.warning(f"Could not clear table: HTTP {del_res.status_code} - {del_res.text}")

    endpoint = f"{rest_url}/innovations"
    total_uploaded = 0
    logger.info(f"Uploading {len(records)} records...")

    for i in range(0, len(records), batch_size):
        batch = records[i:i + batch_size]
        try:
            res = requests.post(endpoint, headers=headers, json=batch)
            if res.status_code in (200, 201):
                total_uploaded += len(batch)
                logger.info(f"Uploaded batch {i + 1}-{min(i + batch_size, len(records))} / {len(records)}")
            elif res.status_code == 401 or "row-level security" in res.text.lower():
                logger.error("RLS error: Anon key rejected. Set service_role key or disable RLS in Supabase.")
                return False
            elif res.status_code == 400 and "too long for type" in res.text.lower():
                logger.warning("Field exceeds VARCHAR(255). Retrying with truncated values...")
                records_trunc = [map_item(it, include_category=has_cat, include_url=has_url, truncate=True) for it in innovations]
                batch_trunc = records_trunc[i:i + batch_size]
                res_trunc = requests.post(endpoint, headers=headers, json=batch_trunc)
                if res_trunc.status_code in (200, 201):
                    total_uploaded += len(batch_trunc)
                    logger.info(f"Uploaded batch {i + 1}-{min(i + batch_size, len(records))} (truncated)")
                else:
                    logger.error(f"Insert failed: {res_trunc.text}")
                    return False
            else:
                logger.error(f"HTTP {res.status_code}: {res.text}")
        except Exception as e:
            logger.error(f"Network error: {e}")
            return False

    logger.info(f"Success: {total_uploaded} records inserted into Supabase.")
    return True

def test_connection(rest_url: str, api_key: str):
    headers = {
        "apikey": api_key,
        "Authorization": f"Bearer {api_key}",
    }
    logger.info(f"Checking Supabase connection: {rest_url}")
    try:
        r = requests.get(f"{rest_url}/innovations?limit=1", headers=headers)
        if r.status_code == 200:
            logger.info("Read test: SUCCESS (innovations table reachable)")
        else:
            logger.error(f"Read test: FAILED (HTTP {r.status_code}: {r.text})")
            return False
    except Exception as e:
        logger.error(f"Read test: NETWORK ERROR ({e})")
        return False

    post_headers = {
        "apikey": api_key,
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json",
        "Prefer": "return=minimal"
    }
    probe = [{"title": "__conn_probe_test__"}]
    try:
        pr = requests.post(f"{rest_url}/innovations", headers=post_headers, json=probe)
        if pr.status_code in (200, 201):
            logger.info("Write test: SUCCESS (Write permissions OK)")
            requests.delete(f"{rest_url}/innovations?title=eq.__conn_probe_test__", headers=post_headers)
            return True
        elif pr.status_code == 401 or "row-level security" in pr.text.lower():
            logger.warning("Write test: BLOCKED by Supabase Row-Level Security (RLS).")
            logger.warning("Reason: The provided key is a public anon key without insert permission.")
            logger.warning("Fix: In Supabase SQL Editor run 'ALTER TABLE innovations DISABLE ROW LEVEL SECURITY;' or use the service_role key.")
            return False
        else:
            logger.warning(f"Write test returned HTTP {pr.status_code}: {pr.text}")
            return False
    except Exception as e:
        logger.error(f"Write test error: {e}")
        return False

def main():
    parser = argparse.ArgumentParser(description="Upload social innovations to Supabase.")
    parser.add_argument("--dry-run", action="store_true", help="Validate without writing to database.")
    parser.add_argument("--check", action="store_true", help="Test Supabase connection and read/write permissions.")
    parser.add_argument("--clear", action="store_true", help="Clear existing records in innovations table before upload.")
    parser.add_argument("--clear-only", action="store_true", help="Delete all existing records in innovations table without uploading.")
    parser.add_argument("--limit", type=int, default=None, help="Limit number of records to upload (e.g. 1 for testing).")
    parser.add_argument("--batch-size", type=int, default=20, help="Batch size for inserts (default: 20).")
    args = parser.parse_args()

    rest_url, api_key, data_json_path = load_config()

    if args.check:
        test_connection(rest_url, api_key)
        return

    if args.clear_only:
        headers = {
            "apikey": api_key,
            "Authorization": f"Bearer {api_key}",
        }
        logger.info("Clearing all records in innovations table...")
        del_res = requests.delete(f"{rest_url}/innovations?id=not.is.null", headers=headers)
        if del_res.status_code in (200, 204):
            logger.info("All records deleted successfully.")
        else:
            logger.error(f"Failed to clear table: HTTP {del_res.status_code} - {del_res.text}")
        return

    innovations = load_data(data_json_path, limit=args.limit)
    upload_records(
        rest_url,
        api_key,
        innovations,
        batch_size=args.batch_size,
        dry_run=args.dry_run,
        clear_first=args.clear
    )

if __name__ == "__main__":
    main()
