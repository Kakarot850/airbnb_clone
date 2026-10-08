from datetime import date, datetime

from pydantic import BaseModel, ConfigDict, Field

from app.schemas.user import UserPublic


class BookingCreate(BaseModel):
    listing_id: int
    check_in: date
    check_out: date
    adults: int = Field(default=1, ge=1, le=16)
    children: int = Field(default=0, ge=0, le=15)
    infants: int = Field(default=0, ge=0, le=5)
    pets: int = Field(default=0, ge=0, le=5)


class BookingListing(BaseModel):
    """The bits of a listing shown on trip / reservation cards."""

    model_config = ConfigDict(from_attributes=True)

    id: int
    title: str
    property_type: str
    room_type: str
    address: str
    city: str
    state: str | None
    country: str
    latitude: float
    longitude: float
    cover_image_url: str | None
    host: UserPublic


class BookingOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    listing: BookingListing
    guest: UserPublic
    check_in: date
    check_out: date
    adults: int
    children: int
    infants: int
    pets: int
    guests: int
    nights: int
    nightly_price: int
    cleaning_fee: int
    service_fee: int
    total_price: int
    status: str  # confirmed | cancelled
    trip_status: str  # upcoming | current | completed | cancelled
    has_review: bool
    created_at: datetime
    cancelled_at: datetime | None
