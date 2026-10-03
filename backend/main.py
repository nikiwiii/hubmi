import sys
from pathlib import Path

import uvicorn
from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from supabase_client import is_supabase_connected, SUPABASE_URL
from login.router import router as login_router
from ideas.router import router as ideas_router
from matching.router import router as matching_router
from chat.router import router as chat_router
from innovations.router import router as innovations_router

# Idea Creator is a self-contained app whose package is named `app`; it must stay importable standalone.
sys.path.insert(0, str(Path(__file__).resolve().parent / "idea_creator"))
from app.main import app as idea_creator_app  # noqa: E402

app = FastAPI(
    title="Hubmi API - Ideas, Community, RAG Matching & ROPS Kraków Chat",
    description="Backend API z FastAPI, Supabase, Groq RAG oraz komunikatorem ROPS Kraków dla ekspertów i mieszkańców (polling co 3s).",
    version="1.3.0"
)

# Custom validation error handler
@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    for err in exc.errors():
        loc = err.get("loc", [])
        if "password" in loc:
            return JSONResponse(
                status_code=422,
                content={"detail": "Za krótkie hasło!"}
            )
        if "email" in loc:
            return JSONResponse(
                status_code=422,
                content={"detail": "Niepoprawny format adresu e-mail."}
            )
        if "full_name" in loc:
            return JSONResponse(
                status_code=422,
                content={"detail": "Wprowadź poprawne imię (minimum 2 znaki)."}
            )
    first_err = exc.errors()[0] if exc.errors() else {}
    msg = first_err.get("msg", "Błąd walidacji danych.")
    return JSONResponse(status_code=422, content={"detail": msg})

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Podłączamy routery do aplikacji
app.include_router(login_router)
app.include_router(ideas_router)
app.include_router(matching_router)
app.include_router(chat_router)
app.include_router(innovations_router)

# Kreator pomysłów (asystent AI + publikacja): /api/idea-creator/assistant/*, /api/idea-creator/projects
app.mount("/api/idea-creator", idea_creator_app)

@app.get("/", tags=["Status"])
def root():
    return {
        "app": "Hubmi API",
        "status": "online",
        "supabase_connected": is_supabase_connected,
        "supabase_url": SUPABASE_URL if is_supabase_connected else "Not configured (using local fallback)",
        "docs_url": "/docs"
    }

@app.get("/health", tags=["Status"])
def health_check():
    return {
        "status": "healthy",
        "supabase_active": is_supabase_connected
    }

if __name__ == "__main__":
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)
