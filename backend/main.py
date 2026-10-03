import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from supabase_client import is_supabase_connected, SUPABASE_URL
from login.router import router as login_router
from ideas.router import router as ideas_router
from matching.router import router as matching_router
from chat.router import router as chat_router

app = FastAPI(
    title="Hubmi API - Ideas, Community, RAG Matching & ROPS Kraków Chat",
    description="Backend API z FastAPI, Supabase, Groq RAG oraz komunikatorem ROPS Kraków dla ekspertów i mieszkańców (polling co 3s).",
    version="1.2.0"
)

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
