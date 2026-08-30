import os
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    DATABASE_URL: str = "sqlite:///./edugrade.db"
    FRONTEND_URL: str = "http://localhost:5173"
    ENGINE_VERSION: str = "1.0"
    GPA_ROUNDING_PRECISION: int = 2
    OPENROUTER_API_KEY: str = ""

    # Load from .env file if it exists
    model_config = SettingsConfigDict(
        env_file=os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), ".env"),
        env_file_encoding="utf-8",
        extra="ignore"
    )

settings = Settings()
