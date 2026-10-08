"""Application settings, read from environment variables with local-friendly defaults."""
import os
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent  # the backend/ folder

# SQLite file lives next to the code by default: backend/airbnb.db
DATABASE_URL = os.getenv("DATABASE_URL", f"sqlite:///{BASE_DIR / 'airbnb.db'}")

# Used to sign login tokens (JWT). Always override this in production.
SECRET_KEY = os.getenv("SECRET_KEY", "local-dev-secret-key-change-me-in-production")
TOKEN_EXPIRE_DAYS = int(os.getenv("TOKEN_EXPIRE_DAYS", "7"))

# Comma separated list of allowed frontend origins ("*" allows any origin).
CORS_ORIGINS = [o.strip() for o in os.getenv("CORS_ORIGINS", "*").split(",") if o.strip()]

# Uploaded listing photos are stored on disk and served from /uploads.
UPLOAD_DIR = Path(os.getenv("UPLOAD_DIR", str(BASE_DIR / "uploads")))
# Public base URL of this API (e.g. https://api.example.com). Optional: when empty,
# the URL of the incoming request is used to build links to uploaded files.
PUBLIC_URL = os.getenv("PUBLIC_URL", "").rstrip("/")

# Seed demo data automatically when the database is empty (handy on free hosting
# tiers where the disk is wiped on every deploy).
SEED_ON_STARTUP = os.getenv("SEED_ON_STARTUP", "true").lower() == "true"
