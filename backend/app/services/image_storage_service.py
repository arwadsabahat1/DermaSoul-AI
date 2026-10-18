import os
import uuid
from pathlib import Path

from app.config import settings


def _safe_extension(filename: str | None) -> str:
    if not filename or "." not in filename:
        return "jpg"
    return filename.rsplit(".", 1)[-1].lower().strip() or "jpg"


def ensure_upload_directory() -> Path:
    upload_dir = Path(settings.UPLOAD_DIR)
    upload_dir.mkdir(parents=True, exist_ok=True)
    return upload_dir


def save_uploaded_image_bytes(file_bytes: bytes, original_filename: str | None) -> tuple[str, str]:
    upload_dir = ensure_upload_directory()
    ext = _safe_extension(original_filename)
    stored_filename = f"{uuid.uuid4().hex}.{ext}"
    file_path = upload_dir / stored_filename
    file_path.write_bytes(file_bytes)
    return stored_filename, str(file_path)


def delete_uploaded_image(stored_filename: str | None) -> None:
    if not stored_filename:
        return
    if "/" in stored_filename or "\\" in stored_filename or ".." in stored_filename:
        return
    upload_dir = ensure_upload_directory()
    file_path = (upload_dir / stored_filename).resolve()
    base = upload_dir.resolve()
    if not str(file_path).startswith(str(base)):
        return
    if file_path.is_file():
        file_path.unlink()
