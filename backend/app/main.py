import logging
from contextlib import asynccontextmanager
from logging.handlers import RotatingFileHandler
from pathlib import Path

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.config import settings
from app.database import Base, engine
from app.models import User, Profile, Consultation, Product, EducationArticle, Dermatologist
from app.routers.auth_router import router as auth_router
from app.routers.profile_router import router as profile_router
from app.routers.diagnosis_router import router as diagnosis_router
from app.routers.consultation_router import router as consultation_router
from app.routers.product_router import router as product_router
from app.routers.education_router import router as education_router
from app.routers.admin_router import router as admin_router
from app.routers.dermatologist_router import router as dermatologist_router
from app.services.image_storage_service import ensure_upload_directory


LOG_FILE = Path(__file__).resolve().parent.parent / "logs" / "dermasoul.log"
logger = logging.getLogger("dermasoul")


def configure_error_logging() -> None:
    """Write unexpected server errors (with tracebacks) to backend/logs/dermasoul.log."""
    if logger.handlers:
        return
    LOG_FILE.parent.mkdir(parents=True, exist_ok=True)
    handler = RotatingFileHandler(LOG_FILE, maxBytes=5 * 1024 * 1024, backupCount=3, encoding="utf-8")
    handler.setFormatter(logging.Formatter("%(asctime)s %(levelname)s %(name)s: %(message)s"))
    logger.addHandler(handler)
    logger.setLevel(logging.INFO)


configure_error_logging()


@asynccontextmanager
async def lifespan(app: FastAPI):
    Base.metadata.create_all(bind=engine)
    ensure_upload_directory()
    if settings.NLP_ENTITY_WARMUP_ON_START and settings.NLP_ENTITY_MODEL:
        from app.services.nlp_entities_service import warmup_entity_ner_pipeline

        warmup_entity_ner_pipeline()
    yield


app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description=(
        "REST API for skin-image analysis, saved consultations with PDF export, "
        "education articles, curated products, dermatologist referrals, and admin dashboards."
    ),
    lifespan=lifespan,
)


@app.exception_handler(Exception)
async def unhandled_exception_handler(request: Request, exc: Exception):
    # Validation and HTTP errors keep FastAPI's own handlers; only unexpected failures reach here.
    logger.exception("Unhandled error on %s %s", request.method, request.url.path)
    return JSONResponse(
        status_code=500,
        content={"detail": "An unexpected server error occurred. Please try again."},
    )


app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


app.include_router(auth_router)
app.include_router(profile_router)
app.include_router(diagnosis_router)
app.include_router(consultation_router)
app.include_router(product_router)
app.include_router(education_router)
app.include_router(admin_router)
app.include_router(dermatologist_router)


@app.get("/")
def root():
    return {
        "message": "DermaSoul AI backend is running",
        "version": settings.APP_VERSION
    }


@app.get("/health")
def health_check():
    return {
        "status": "healthy"
    }