"""Shared FastAPI dependencies: database session and the logged-in user."""
from typing import Annotated

from fastapi import Depends
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

from app.database import get_db
from app.errors import Unauthorized
from app.models import User
from app.security import decode_access_token

bearer_scheme = HTTPBearer(auto_error=False)

DbSession = Annotated[Session, Depends(get_db)]


def get_optional_user(
    db: DbSession,
    credentials: Annotated[HTTPAuthorizationCredentials | None, Depends(bearer_scheme)],
) -> User | None:
    """The user from the `Authorization: Bearer <token>` header, or None for guests."""
    if credentials is None:
        return None
    user_id = decode_access_token(credentials.credentials)
    return db.get(User, user_id) if user_id is not None else None


def get_current_user(user: Annotated[User | None, Depends(get_optional_user)]) -> User:
    """Like get_optional_user but responds 401 when nobody is logged in."""
    if user is None:
        raise Unauthorized()
    return user


OptionalUser = Annotated[User | None, Depends(get_optional_user)]
CurrentUser = Annotated[User, Depends(get_current_user)]
