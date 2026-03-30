"""Application settings loaded from environment (12-factor)."""

from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    app_name: str = "MediTracker AI"
    debug: bool = False

    # Database: SQLite for dev/hackathon; set postgresql+psycopg://... for production
    database_url: str = "sqlite:///./meditracker.db"

    # OpenAI (chatbot + report insights)
    openai_api_key: str = ""
    api_base_url: str = "https://api.openai.com/v1"
    model_name: str = "gpt-4o-mini"

    # Subscription gate for mental-health chat (demo: header flag)
    chat_subscription_required: bool = False

    # Pharmacy stub: external API base if you integrate a real partner later
    pharmacy_partner_base_url: str = ""

    # Auth (use a strong random value in production)
    secret_key: str = "dev-secret-change-in-production-use-openssl-rand"


@lru_cache
def get_settings() -> Settings:
    return Settings()
