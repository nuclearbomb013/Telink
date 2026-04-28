"""
Upload API Endpoints
"""

import os
import uuid
from datetime import datetime
from fastapi import APIRouter, Depends, UploadFile, File

from app.api.deps import get_current_active_user
from app.models.user import User
from app.schemas import ServiceResponse
from app.schemas.upload import UploadResponse
from app.config import settings

router = APIRouter(prefix="/upload", tags=["Upload"])

# Upload directory configuration
UPLOAD_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(__file__)))), "uploads")
IMAGES_DIR = os.path.join(UPLOAD_DIR, "images")
MAX_FILE_SIZE = 5 * 1024 * 1024  # 5MB
ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".gif", ".webp"}


def ensure_upload_dirs():
    """Ensure upload directories exist."""
    os.makedirs(IMAGES_DIR, exist_ok=True)


@router.post("/image", response_model=ServiceResponse[UploadResponse])
async def upload_image(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_active_user),
):
    """
    Upload an image file.

    Returns the URL to access the uploaded image.
    Requires authentication.
    """
    return await _do_upload_image(file)


@router.post("/image-public", response_model=ServiceResponse[UploadResponse])
async def upload_image_public(
    file: UploadFile = File(...),
):
    """
    Public upload endpoint for testing (development only).
    """
    return await _do_upload_image(file)


async def _do_upload_image(file: UploadFile) -> ServiceResponse[UploadResponse]:
    """Internal function to handle image upload."""
    # Validate file type
    ext = os.path.splitext(file.filename or "image.jpg")[1].lower()
    if ext not in ALLOWED_EXTENSIONS:
        return ServiceResponse(
            success=False,
            error={
                "code": "INVALID_FILE_TYPE",
                "message": "不支持的文件格式，请上传 JPG/PNG/GIF/WebP 格式图片"
            }
        )

    # Read file content
    contents = await file.read()

    # Validate file size
    if len(contents) > MAX_FILE_SIZE:
        return ServiceResponse(
            success=False,
            error={
                "code": "FILE_TOO_LARGE",
                "message": f"文件大小超过限制，最大 {MAX_FILE_SIZE // (1024*1024)}MB"
            }
        )

    if len(contents) == 0:
        return ServiceResponse(
            success=False,
            error={
                "code": "EMPTY_FILE",
                "message": "文件内容为空"
            }
        )

    # Generate unique filename
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    unique_id = uuid.uuid4().hex[:8]
    new_filename = f"{timestamp}_{unique_id}{ext}"

    # Ensure directory exists
    ensure_upload_dirs()

    # Save file
    file_path = os.path.join(IMAGES_DIR, new_filename)
    with open(file_path, "wb") as f:
        f.write(contents)

    # Generate URL
    base_url = "http://localhost:8000" if settings.DEBUG else ""
    url = f"{base_url}/uploads/images/{new_filename}"

    return ServiceResponse(
        success=True,
        data=UploadResponse(
            url=url,
            filename=new_filename,
            size=len(contents),
            content_type=file.content_type or "image/octet-stream"
        )
    )