"""Photo uploads for listings. Files are stored on local disk and served from /uploads."""
from uuid import uuid4

from fastapi import APIRouter, File, Request, UploadFile

from app.config import PUBLIC_URL, UPLOAD_DIR
from app.deps import CurrentUser
from app.errors import BadRequest

router = APIRouter(prefix="/uploads", tags=["uploads"])

ALLOWED_TYPES = {"image/jpeg": ".jpg", "image/png": ".png", "image/webp": ".webp", "image/gif": ".gif"}
MAX_BYTES = 5 * 1024 * 1024  # 5 MB


@router.post("", status_code=201)
async def upload_image(request: Request, _user: CurrentUser, file: UploadFile = File(...)):
    extension = ALLOWED_TYPES.get(file.content_type or "")
    if extension is None:
        raise BadRequest("Please upload a JPG, PNG, WEBP or GIF image.")
    data = await file.read(MAX_BYTES + 1)
    if len(data) > MAX_BYTES:
        raise BadRequest("Images must be 5 MB or smaller.")

    filename = f"{uuid4().hex}{extension}"
    UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
    (UPLOAD_DIR / filename).write_bytes(data)

    base_url = PUBLIC_URL or str(request.base_url).rstrip("/")
    return {"url": f"{base_url}/uploads/{filename}"}
