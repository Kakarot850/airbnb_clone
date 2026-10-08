from datetime import datetime

from pydantic import BaseModel, ConfigDict, EmailStr, Field


class UserPublic(BaseModel):
    """What other people may see about a user (no email)."""

    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    avatar_url: str | None
    created_at: datetime


class UserOut(UserPublic):
    """The logged-in user's own profile."""

    email: str
    bio: str | None
    is_host: bool


class HostProfile(UserPublic):
    """Host card on the listing page, including Superhost status and review stats."""

    bio: str | None
    is_superhost: bool
    listing_count: int
    review_count: int
    rating_avg: float


class LoginRequest(BaseModel):
    email: EmailStr


class SignupRequest(BaseModel):
    email: EmailStr
    name: str = Field(min_length=2, max_length=100)


class AuthResponse(BaseModel):
    token: str
    user: UserOut
