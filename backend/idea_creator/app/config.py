from functools import lru_cache
from pathlib import Path

from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

PROJECT_DIR = Path(__file__).resolve().parent.parent
BACKEND_ENV = PROJECT_DIR.parent / ".env"

# Same fallback as backend/config.py, so tokens stay interchangeable when JWT_SECRET is unset.
DEFAULT_JWT_SECRET = "super-secret-default-hubmi-security-key-32chars-min"


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        # Shared with the main backend; real environment variables take precedence.
        env_file=BACKEND_ENV,
        env_file_encoding="utf-8",
        extra="ignore",
    )

    supabase_url: str = ""
    supabase_key: str = ""
    # Public Supabase Storage bucket for published visualizations (see README migration).
    supabase_image_bucket: str = "idea-images"
    # Public bucket for grant call templates (PDF) uploaded by admins.
    supabase_template_bucket: str = "grant-templates"
    template_max_bytes: int = 10 * 1024 * 1024
    # Template text sent to the LLM is cut to this length (Groq TPM limits).
    template_max_chars: int = 15000

    groq_api_key: str = ""
    groq_model: str = "openai/gpt-oss-120b"
    groq_base_url: str = "https://api.groq.com/openai/v1"
    groq_timeout_seconds: float = 60.0

    # Paid models (e.g. nanobanana2) require a secret `sk_` key from https://enter.pollinations.ai/keys
    pollinations_api_key: str = ""
    pollinations_image_model: str = "nanobanana2"
    pollinations_base_url: str = "https://gen.pollinations.ai"
    pollinations_timeout_seconds: float = 120.0
    image_width: int = 1024
    image_height: int = 768

    jwt_secret: str = DEFAULT_JWT_SECRET
    jwt_algorithm: str = "HS256"

    # One assistant loop round = 2 requests (question + refine), max 10 rounds.
    assistant_rate_limit_per_minute: int = 60
    # Every image generation costs pollen.
    image_rate_limit_per_minute: int = 10
    # Prefill + field assistant of grant applications.
    grants_rate_limit_per_minute: int = 30

    @field_validator("supabase_url")
    @classmethod
    def normalize_supabase_url(cls, value: str) -> str:
        value = value.strip().rstrip("/")
        if value.endswith("/rest/v1"):
            value = value[: -len("/rest/v1")]
        return value

    @field_validator(
        "supabase_key",
        "groq_api_key",
        "groq_model",
        "pollinations_api_key",
        "pollinations_image_model",
        "jwt_secret",
        "jwt_algorithm",
    )
    @classmethod
    def strip_whitespace(cls, value: str) -> str:
        return value.strip()

    @property
    def supabase_configured(self) -> bool:
        return bool(
            self.supabase_url
            and self.supabase_key
            and not self.supabase_url.startswith("https://your-project")
        )


@lru_cache
def get_settings() -> Settings:
    return Settings()
