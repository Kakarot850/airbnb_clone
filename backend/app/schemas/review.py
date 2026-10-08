from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field

from app.schemas.user import UserPublic


class ReviewCreate(BaseModel):
    """Overall rating + comment are required; category ratings default to the overall rating."""

    booking_id: int
    rating: int = Field(ge=1, le=5)
    cleanliness: int | None = Field(default=None, ge=1, le=5)
    accuracy: int | None = Field(default=None, ge=1, le=5)
    checkin: int | None = Field(default=None, ge=1, le=5)
    communication: int | None = Field(default=None, ge=1, le=5)
    location: int | None = Field(default=None, ge=1, le=5)
    value: int | None = Field(default=None, ge=1, le=5)
    comment: str = Field(min_length=10, max_length=2000)


class ReviewOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    listing_id: int
    author: UserPublic
    rating: int
    cleanliness: int
    accuracy: int
    checkin: int
    communication: int
    location: int
    value: int
    comment: str
    created_at: datetime


class RatingSummary(BaseModel):
    average: float
    count: int
    cleanliness: float
    accuracy: float
    checkin: float
    communication: float
    location: float
    value: float
    distribution: dict[str, int]  # {"5": 120, "4": 10, ...} number of reviews per star rating


class ListingReviews(BaseModel):
    summary: RatingSummary
    items: list[ReviewOut]
