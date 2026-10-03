import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from supabase_client import is_supabase_connected, SUPABASE_URL
from login.router import router as login_router
from ideas.router import router as ideas_router

app = FastAPI(
    title="Hubmi API - Ideas & Community",
    description="Backend API z FastAPI i Supabase do obsługi profili, logowania użytkowników, logowania adminów oraz postów/pomysłów z reakcjami (like, volunteer, dislike).",
    version="1.0.0"
)

# CORS Middleware aby frontend (Next.js / inne) mógł bez problemu łączyć się z API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # W produkcji można ograniczyć np. ["http://localhost:3000"]
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Podłączamy routery do aplikacji zgodnie z wymaganiami
app.include_router(login_router)
app.include_router(ideas_router)

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
