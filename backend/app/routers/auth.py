"""Simplified (mock) authentication: log in or sign up with just an email address."""
from fastapi import APIRouter
from sqlalchemy import select

from app.deps import CurrentUser, DbSession
from app.errors import Conflict, NotFound
from app.models import User
from app.schemas.user import AuthResponse, LoginRequest, SignupRequest, UserOut
from app.security import create_access_token

router = APIRouter(prefix="/auth", tags=["auth"])


def _auth_response(user: User) -> AuthResponse:
    return AuthResponse(token=create_access_token(user.id), user=UserOut.model_validate(user))


@router.post("/login", response_model=AuthResponse)
def login(body: LoginRequest, db: DbSession):
    user = db.scalar(select(User).where(User.email == body.email.lower()))
    if user is None:
        raise NotFound("No account found for this email.")
    return _auth_response(user)


@router.post("/signup", response_model=AuthResponse, status_code=201)
def signup(body: SignupRequest, db: DbSession):
    email = body.email.lower()
    if db.scalar(select(User).where(User.email == email)):
        raise Conflict("An account with this email already exists.")
    user = User(email=email, name=body.name.strip())
    db.add(user)
    db.commit()
    return _auth_response(user)


@router.get("/me", response_model=UserOut)
def me(user: CurrentUser):
    return user
