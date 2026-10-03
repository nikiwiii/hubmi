# Idea Creator (Kreator pomysłów)

Standalone FastAPI service: an AI assistant (Groq, OpenAI-compatible API) that helps users refine an idea, plus
publishing into the shared `public.ideas` table. It runs next to the main backend (port 8000) on
port **8001** and does not import or modify it.

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

## Run

```bash
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
| POST | `/projects` | Bearer | Publish a project (`tytul`, `opis`, `innowacyjnosc`, `odbiorcy`, `etap`, optional `category`) |
| GET | `/projects` | no | List of projects (newest first) |
| GET | `/projects/{id}` | no | Single project |

`/assistant/*` is rate limited to 60 requests/min per IP (in memory, per process).

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
  routers/           assistant.py, projects.py (future: visualize.py, applications.py)
  services/llm.py    Groq client + generate_json (validate -> retry once -> 502)
  services/prompts.py all prompts
tests/
```

To add a feature (e.g. grant applications): create `app/routers/applications.py`, add prompts to
`services/prompts.py`, use `generate_json` with a new Pydantic model, and `include_router` in `main.py`.
