"""Login tokens. Auth is intentionally simplified (passwordless): a signed JWT holds the user id."""
from datetime import datetime, timedelta, timezone

import jwt

from app.config import SECRET_KEY, TOKEN_EXPIRE_DAYS

ALGORITHM = "HS256"


def create_access_token(user_id: int) -> str:
    expires_at = datetime.now(timezone.utc) + timedelta(days=TOKEN_EXPIRE_DAYS)
    return jwt.encode({"sub": str(user_id), "exp": expires_at}, SECRET_KEY, algorithm=ALGORITHM)


def decode_access_token(token: str) -> int | None:
    """Return the user id stored in the token, or None if it is invalid or expired."""
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return int(payload["sub"])
    except (jwt.PyJWTError, KeyError, ValueError):
        return None
