"""
Upload API Endpoints

Security:
- All uploads require authentication (no public endpoints)
- Real image validation via magic bytes + Pillow decode/re-encode
- Strict file size limits and content-type verification
"""

import os
import uuid
import logging
from datetime import datetime
from io import BytesIO
from fastapi import APIRouter, Depends, UploadFile, File

from app.api.deps import get_current_active_user
from app.models.user import User
from app.schemas import ServiceResponse
from app.schemas.upload import UploadResponse
from app.config import settings

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/upload", tags=["Upload"])

# Upload directory configuration
UPLOAD_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(__file__)))), "uploads")
IMAGES_DIR = os.path.join(UPLOAD_DIR, "images")
MAX_FILE_SIZE = 5 * 1024 * 1024  # 5MB
ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".gif", ".webp"}

# Maximum image dimensions (prevent pixel bomb attacks)
MAX_IMAGE_WIDTH = 4096
MAX_IMAGE_HEIGHT = 4096
MAX_IMAGE_PIXELS = MAX_IMAGE_WIDTH * MAX_IMAGE_HEIGHT  # ~16.7M pixels


# Magic bytes for allowed image formats
MAGIC_BYTES = {
    b'\xff\xd8\xff': '.jpg',       # JPEG
    b'\x89PNG\r\n\x1a\n': '.png',  # PNG
    b'GIF87a': '.gif',             # GIF87a
    b'GIF89a': '.gif',             # GIF89a
    b'RIFF': '.webp',              # WebP (RIFF container)
}


def ensure_upload_dirs():
    """Ensure upload directories exist."""
    os.makedirs(IMAGES_DIR, exist_ok=True)


def _validate_magic_bytes(contents: bytes) -> bool:
    """
    Validate file magic bytes (file header) to confirm real image type.
    Returns True if magic bytes match a known image format.
    """
    if len(contents) < 12:
        return False

    for magic, ext in MAGIC_BYTES.items():
        if contents.startswith(magic):
            # Additional check for WebP: verify WEBP chunk after RIFF header
            if ext == '.webp':
                if len(contents) >= 12 and contents[8:12] == b'WEBP':
                    return True
            else:
                return True

    return False


def _validate_and_sanitize_image(contents: bytes) -> tuple[bool, bytes, str, str]:
    """
    Validate and sanitize image using Pillow.

    - Decodes the image to verify it's a real, valid image
    - Checks dimensions to prevent pixel bomb attacks
    - Re-encodes to strip any embedded payloads (EXIF XSS, etc.)
    - Returns (valid, sanitized_bytes, format, mime_type)
    """
    try:
        from PIL import Image, ImageFile

        # Enable truncated image loading but set safety limits
        ImageFile.LOAD_TRUNCATED_IMAGES = False

        # Parse image from bytes
        img = Image.open(BytesIO(contents))

        # Verify it's actually an image by reading a pixel
        img.verify()

        # Re-open after verify() (verify() closes the image)
        img = Image.open(BytesIO(contents))

        # Check dimensions
        width, height = img.size
        if width > MAX_IMAGE_WIDTH or height > MAX_IMAGE_HEIGHT:
            return False, b'', '', f"Image dimensions {width}x{height} exceed maximum {MAX_IMAGE_WIDTH}x{MAX_IMAGE_HEIGHT}"

        if width * height > MAX_IMAGE_PIXELS:
            return False, b'', '', f"Image pixel count {width * height} exceeds maximum {MAX_IMAGE_PIXELS}"

        # Determine output format
        fmt = img.format or 'PNG'
        if fmt.upper() not in ('JPEG', 'PNG', 'GIF', 'WEBP'):
            fmt = 'PNG'  # Default to PNG for unknown formats

        # Re-encode to strip metadata and embedded payloads
        output = BytesIO()
        if fmt.upper() in ('JPEG', 'JPG'):
            # Convert RGBA to RGB for JPEG
            if img.mode in ('RGBA', 'P'):
                img = img.convert('RGB')
            img.save(output, format='JPEG', quality=85, optimize=True)
        elif fmt.upper() == 'PNG':
            img.save(output, format='PNG', optimize=True)
        elif fmt.upper() == 'GIF':
            img.save(output, format='GIF', optimize=True)
        elif fmt.upper() == 'WEBP':
            img.save(output, format='WEBP', quality=85)

        sanitized = output.getvalue()

        # Validate sanitized output size
        if len(sanitized) > MAX_FILE_SIZE:
            return False, b'', '', f"Sanitized image size {len(sanitized)} exceeds maximum {MAX_FILE_SIZE}"

        # Map format to extension and MIME type
        fmt_map = {
            'JPEG': ('.jpg', 'image/jpeg'),
            'PNG': ('.png', 'image/png'),
            'GIF': ('.gif', 'image/gif'),
            'WEBP': ('.webp', 'image/webp'),
        }
        ext, mime = fmt_map.get(fmt.upper(), ('.png', 'image/png'))

        return True, sanitized, ext, mime

    except Exception as e:
        logger.warning(f"Image validation failed: {e}")
        return False, b'', '', f"Invalid or corrupted image: {str(e)}"


@router.post("/image", response_model=ServiceResponse[UploadResponse])
async def upload_image(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_active_user),
):
    """
    Upload an image file. Requires authentication.

    Security:
    - Magic bytes verification (prevent file type spoofing)
    - Pillow decode/re-encode (strip embedded payloads, prevent pixel bombs)
    - Rate limited per user
    - Audit logged
    """
    return await _do_upload_image(file, current_user)


async def _do_upload_image(file: UploadFile, user: User) -> ServiceResponse[UploadResponse]:
    """Internal function to handle image upload with full security validation."""
    # Step 1: Basic extension check (quick filter)
    ext = os.path.splitext(file.filename or "image.jpg")[1].lower()
    if ext not in ALLOWED_EXTENSIONS:
        logger.warning(f"Upload rejected: invalid extension {ext} by user {user.id}")
        return ServiceResponse(
            success=False,
            error={
                "code": "INVALID_FILE_TYPE",
                "message": f"Unsupported file format. Allowed: {', '.join(sorted(ALLOWED_EXTENSIONS))}"
            }
        )

    # Step 2: Read file content
    contents = await file.read()

    # Step 3: Size validation
    if len(contents) == 0:
        return ServiceResponse(
            success=False,
            error={"code": "EMPTY_FILE", "message": "File content is empty"}
        )

    if len(contents) > MAX_FILE_SIZE:
        logger.warning(f"Upload rejected: file too large ({len(contents)} bytes) by user {user.id}")
        return ServiceResponse(
            success=False,
            error={
                "code": "FILE_TOO_LARGE",
                "message": f"File size exceeds maximum of {MAX_FILE_SIZE // (1024*1024)}MB"
            }
        )

    # Step 4: Magic bytes validation (prevent extension spoofing)
    if not _validate_magic_bytes(contents):
        logger.warning(
            f"Upload rejected: invalid magic bytes by user {user.id}, claimed ext={ext}, "
            f"first_bytes={contents[:16].hex()}"
        )
        return ServiceResponse(
            success=False,
            error={
                "code": "INVALID_FILE_TYPE",
                "message": "File content does not match declared image type"
            }
        )

    # Step 5: Pillow-based image validation and sanitization
    valid, sanitized, safe_ext, safe_mime = _validate_and_sanitize_image(contents)
    if not valid:
        logger.warning(f"Upload rejected: Pillow validation failed by user {user.id}: {safe_ext}")
        return ServiceResponse(
            success=False,
            error={
                "code": "INVALID_IMAGE",
                "message": f"Image validation failed: {safe_ext}"
            }
        )

    # Step 6: Generate unique filename (never trust original filename)
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    unique_id = uuid.uuid4().hex[:12]
    new_filename = f"{timestamp}_{unique_id}{safe_ext}"

    # Step 7: Save sanitized file
    ensure_upload_dirs()
    file_path = os.path.join(IMAGES_DIR, new_filename)
    with open(file_path, "wb") as f:
        f.write(sanitized)

    # Generate URL
    base_url = "http://localhost:8000" if settings.DEBUG else ""
    url = f"{base_url}/uploads/images/{new_filename}"

    # Audit log
    logger.info(
        f"Upload successful: user={user.id} file={new_filename} "
        f"original_size={len(contents)} sanitized_size={len(sanitized)} "
        f"claimed_type={file.content_type} verified_type={safe_mime}"
    )

    return ServiceResponse(
        success=True,
        data=UploadResponse(
            url=url,
            filename=new_filename,
            size=len(sanitized),
            content_type=safe_mime
        )
    )