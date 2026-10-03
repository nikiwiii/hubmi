# Idea Creator (Kreator pomysłów)

Self-contained FastAPI app: an AI assistant (Groq, OpenAI-compatible API) that helps users refine an idea, plus
publishing into the shared `public.ideas` table. The main backend (`backend/main.py`) mounts it under
**`/api/idea-creator`**, so it starts together with the main backend on port 8000. It can still run
standalone (e.g. port 8001) and does not import anything from the main backend.

## Compatibility with the main backend

- **JWT**: same scheme as `backend/config.py` (PyJWT, `HS256`, claims `sub`, `email`, `role`, `name`).
  A token from `POST /api/login/user` works here. `user_id` = `sub`, `author_name` = `name`.
- **Config**: reads only `backend/.env` (shared with the main backend; template: `backend/.env.example`),
  so `SUPABASE_*`, `JWT_SECRET` and `GROQ_API_KEY` / `GROQ_MODEL` are shared with the main backend.
- **Database**: writes the same `ideas` columns the main backend uses (`title`, `description`,
  `category`, `user_id`, `author_name`) plus `innovation`, `target_audience`, `stage`.
  Published projects therefore also show up in `GET /api/ideas`.

## Setup

```bash
cd backend
source .venv/bin/activate          # shared venv with the main backend
pip install -r requirements.txt    # single requirements file for the whole backend
cd idea_creator
# make sure GROQ_API_KEY (and optionally GROQ_MODEL) is set in backend/.env (see backend/.env.example)
```

Required DB migration (already applied):

```sql
ALTER TABLE public.ideas ADD COLUMN IF NOT EXISTS innovation TEXT;
ALTER TABLE public.ideas ADD COLUMN IF NOT EXISTS target_audience TEXT;
ALTER TABLE public.ideas ADD COLUMN IF NOT EXISTS stage TEXT
  CHECK (stage IN ('pomysl','prototyp','przetestowane_rozwiazanie','gotowe_do_wdrozenia'));
```

Migration for published visualizations (column `image_url` + public Storage bucket `idea-images`
with an anon INSERT policy): see the "Wizualizacje pomysłów" block in `backend/supabase_schema.sql`.
Until it is applied, publishing without an image still works; publishing with one returns 502.

## Run

Together with the main backend (default; frontend uses `http://localhost:8000/api/idea-creator`):

```bash
cd backend && python main.py
# docs: http://127.0.0.1:8000/api/idea-creator/docs
```

Standalone (then set `NEXT_PUBLIC_IDEA_CREATOR_URL=http://localhost:8001` in the frontend):

```bash
cd backend/idea_creator
uvicorn app.main:app --reload --port 8001
# or: python -m app.main
```

Docs: http://127.0.0.1:8001/docs, status: http://127.0.0.1:8001/health

## Tests

```bash
pytest
```

The LLM and the repository are faked; tests make no network calls.

## Endpoints

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/assistant/questions` | no | Exactly one next question (or `done`) + `completeness` (0–100) |
| POST | `/assistant/refine` | no | Proposal changing only the asked field + its change summary (stateless, no DB) |
| POST | `/generate_image` | no | Visualization of the idea: Groq writes an image prompt from the fields, Pollinations (`nanobanana2`) renders it; returns `{image (data URL), prompt, model}` (stateless, not stored) |
| POST | `/projects` | Bearer | Publish a project (`tytul`, `opis`, `innowacyjnosc`, `odbiorcy`, `etap`, optional `category`, optional `image` = data URL from `/generate_image`, uploaded to Storage and returned as `image_url`) |
| GET | `/projects` | no | List of projects (newest first) |
| GET | `/projects/{id}` | no | Single project |

`/assistant/*` is rate limited to 60 requests/min per IP and `/generate_image` to 10 requests/min per IP
(in memory, per process).

`/generate_image` needs `POLLINATIONS_API_KEY` (secret `sk_` key from https://enter.pollinations.ai/keys;
`nanobanana2` is a paid model) in `backend/.env`; optional `POLLINATIONS_IMAGE_MODEL` (default `nanobanana2`).
Without the key it returns 503.

### Assistant loop (max 10 rounds)

1. `POST /assistant/questions` with the current fields and `history`
   (`[{field, question, answer, accepted}]`, `answer: ""` = skipped). Returns
   `{question: {id, field, text} | null, completeness, round, max_rounds, done}`.
   `done: true` when the idea is complete or `history` already has 10 entries (no LLM call then).
2. `POST /assistant/refine` with the current fields, `question` (as returned) and `answer`.
   Returns `{proposal, changes}`; `proposal` differs from the input only in `question.field`,
   `changes` has 0 or 1 entry.
3. The frontend applies `proposal` if the user accepts, appends the round to `history`, and repeats.

`etap`: `pomysl` | `prototyp` | `przetestowane_rozwiazanie` | `gotowe_do_wdrozenia`.

## Structure

```
app/
  main.py            app, CORS, router registration
  config.py          pydantic-settings
  auth.py            get_current_user (JWT)
  repository.py      IdeasRepository: the only place with the table name and column mapping
  schemas.py         Stage enum + all Pydantic models
  rate_limit.py      in-memory limiter for /assistant/*
  routers/           assistant.py, projects.py, visualize.py (future: applications.py)
  services/llm.py    Groq client + generate_json (validate -> retry once -> 502)
  services/images.py Pollinations image client
  services/storage.py Supabase Storage upload of published images
  services/prompts.py all prompts
tests/
```

To add a feature (e.g. grant applications): create `app/routers/applications.py`, add prompts to
`services/prompts.py`, use `generate_json` with a new Pydantic model, and `include_router` in `main.py`.
