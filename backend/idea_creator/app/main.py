import logging

import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import get_settings
from app.routers import assistant, projects, visualize

logging.basicConfig(level=logging.INFO)

app = FastAPI(
    title="Hubmi Idea Creator API",
    description="Kreator pomysłów: asystent AI (Groq) do dopracowania pomysłu, wizualizacja pomysłu "
    "(Pollinations) oraz publikacja projektów w katalogu.",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Future: routers/applications.py
app.include_router(assistant.router)
app.include_router(projects.router)
app.include_router(visualize.router)


@app.get("/", tags=["Status"])
def root():
    return {"app": "Hubmi Idea Creator API", "status": "online", "docs_url": "/docs"}


@app.get("/health", tags=["Status"])
def health_check():
    settings = get_settings()
    return {
        "status": "healthy",
        "supabase_configured": settings.supabase_configured,
        "llm_configured": bool(settings.groq_api_key),
        "llm_model": settings.groq_model,
        "image_configured": bool(settings.pollinations_api_key),
        "image_model": settings.pollinations_image_model,
    }


if __name__ == "__main__":
    uvicorn.run("app.main:app", host="127.0.0.1", port=8001, reload=True)
