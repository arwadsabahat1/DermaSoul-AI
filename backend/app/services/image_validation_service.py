from io import BytesIO

from fastapi import HTTPException, UploadFile, status
from PIL import Image, UnidentifiedImageError

from app.config import settings


ALLOWED_IMAGE_TYPES = {
    "image/jpeg",
    "image/png",
}

ALLOWED_IMAGE_EXTENSIONS = {
    "jpg",
    "jpeg",
    "png",
}


def get_file_extension(filename: str | None) -> str:
    if not filename or "." not in filename:
        return ""

    return filename.rsplit(".", 1)[-1].lower().strip()


def validate_image_file_metadata(file: UploadFile, file_bytes: bytes) -> None:
    if file is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Skin image is required."
        )

    if not file_bytes:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Uploaded image is empty."
        )

    max_size_bytes = settings.MAX_IMAGE_SIZE_MB * 1024 * 1024

    if len(file_bytes) > max_size_bytes:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Image size must be less than {settings.MAX_IMAGE_SIZE_MB}MB."
        )

    if file.content_type not in ALLOWED_IMAGE_TYPES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only JPG, JPEG, and PNG images are allowed."
        )

    extension = get_file_extension(file.filename)

    if extension not in ALLOWED_IMAGE_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid image extension. Please upload JPG, JPEG, or PNG."
        )


def open_and_validate_image(file_bytes: bytes) -> Image.Image:
    try:
        image = Image.open(BytesIO(file_bytes))
        image.verify()
    except UnidentifiedImageError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or corrupted image file."
        )
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Could not process the uploaded image."
        )

    try:
        image = Image.open(BytesIO(file_bytes)).convert("RGB")
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Could not reopen the uploaded image."
        )

    width, height = image.size
    min_resolution = 128

    if width < min_resolution or height < min_resolution:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Image resolution is too low. Uploaded image size is {width}x{height}. Please upload an image of at least {min_resolution}x{min_resolution} pixels."
        )

    return image


def validate_uploaded_image(file: UploadFile, file_bytes: bytes) -> Image.Image:
    validate_image_file_metadata(file, file_bytes)
    image = open_and_validate_image(file_bytes)
    return image