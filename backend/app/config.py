from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import List
import os
from pathlib import Path

# Get the app directory
APP_DIR = Path(__file__).parent
BACKEND_ROOT = APP_DIR.parent


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    APP_NAME: str = "DermaSoul AI"
    APP_VERSION: str = "1.0.0"
    ENVIRONMENT: str = "development"

    DATABASE_URL: str

    JWT_SECRET_KEY: str
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60

    # Frontend dev — Vite uses 5173 or the next free port (e.g. 5174) if 5173 is busy.
    BACKEND_CORS_ORIGINS: str = (
        "http://localhost:5173,http://127.0.0.1:5173,"
        "http://localhost:5174,http://127.0.0.1:5174"
    )
    UPLOAD_DIR: str = "app/uploads"
    MAX_IMAGE_SIZE_MB: int = 10
    MAX_REPORT_SIZE_MB: int = 15
    # Match uvicorn `--port`; keep in sync with frontend VITE_DEV_PROXY_TARGET (default proxy uses 8010).
    PUBLIC_BASE_URL: str = "http://127.0.0.1:8010"

    SMTP_ENABLED: bool = False
    SMTP_HOST: str = "smtp.gmail.com"
    SMTP_PORT: int = 587
    SMTP_USERNAME: str = ""
    SMTP_PASSWORD: str = ""
    SMTP_USE_TLS: bool = True
    SMTP_FROM_EMAIL: str = "noreply@dermasoul.ai"

    DIAGNOSIS_MODEL_PATH: str = str(APP_DIR / "ml" / "ml_models" / "diagnosis_model_optimized.pth")
    SKIN_TYPE_MODEL_PATH: str = str(APP_DIR / "ml" / "ml_models" / "skin_type_model.pth")

    # AI stack runtime settings
    # Use a token-classification checkpoint by default to avoid random classifier head warnings.
    NLP_ENTITY_MODEL: str = str(APP_DIR / "ml" / "hf_models" / "biomedical-ner-all")
    NLP_ENTITY_MAX_LENGTH: int = 256
    # Persistent Hugging Face cache (models download here once; point to a mounted volume in prod).
    HF_CACHE_DIR: str = str(BACKEND_ROOT / ".hf-cache")
    # Local-first setup: keep model loading offline by default.
    NLP_HF_HUB_OFFLINE: bool = True
    # Load NER on startup so the first /diagnosis/analyze request is not a cold start.
    NLP_ENTITY_WARMUP_ON_START: bool = False
    RAG_EMBEDDING_MODEL: str = str(APP_DIR / "ml" / "hf_models" / "bge-base-en-v1.5")
    RAG_RERANKER_MODEL: str = str(APP_DIR / "ml" / "hf_models" / "bge-reranker-base")
    REDIS_URL: str = "redis://localhost:6379/0"

    @property
    def cors_origins(self) -> List[str]:
        return [origin.strip() for origin in self.BACKEND_CORS_ORIGINS.split(",")]


def _configure_huggingface_env() -> None:
    """Apply cache + hub timeouts before any transformers/huggingface_hub use."""
    cache = Path(settings.HF_CACHE_DIR).expanduser().resolve()
    cache.mkdir(parents=True, exist_ok=True)
    os.environ.setdefault("HF_HOME", str(cache))
    os.environ.setdefault("HF_HUB_ETAG_TIMEOUT", "60")
    os.environ.setdefault("HF_HUB_DOWNLOAD_TIMEOUT", "180")
    os.environ.setdefault("HF_HUB_DISABLE_XET", "1")
    if settings.NLP_HF_HUB_OFFLINE:
        os.environ["HF_HUB_OFFLINE"] = "1"


settings = Settings()
_configure_huggingface_env()