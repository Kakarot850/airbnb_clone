from datetime import date, datetime
from typing import Literal, get_args

from pydantic import BaseModel, ConfigDict, Field, field_validator

from app.schemas.meta import AmenityOut, CategoryOut
from app.schemas.user import HostProfile

PropertyType = Literal[
    "House", "Apartment", "Villa", "Cabin", "Cottage", "Chalet", "Guesthouse", "Hotel",
    "Castle", "Treehouse", "Tiny home", "Farm stay", "Boat", "Camper", "Tent",
]
RoomType = Literal["entire_home", "private_room", "shared_room"]
PROPERTY_TYPES: tuple[str, ...] = get_args(PropertyType)


class ListingCard(BaseModel):
    """Everything a listing card in the explore grid / map needs."""

    model_config = ConfigDict(from_attributes=True)

    id: int
    host_id: int
    title: str
    property_type: str
    room_type: str
    city: str
    state: str | None
    country: str
    latitude: float
    longitude: float
    price_per_night: int
    max_guests: int
    bedrooms: int
    beds: int
    bathrooms: float
    rating_avg: float
    review_count: int
    is_guest_favorite: bool
    image_urls: list[str]
    category: CategoryOut | None
    # Only filled when the search included dates: total price for the whole stay.
    total_price: int | None = None


class ListingDetail(ListingCard):
    description: str
    address: str
    cleaning_fee: int
    amenities: list[AmenityOut]
    host: HostProfile
    created_at: datetime
    updated_at: datetime


class HostListing(ListingCard):
    """A listing as shown on the host dashboard, with booking stats."""

    cleaning_fee: int
    created_at: datetime
    updated_at: datetime
    upcoming_bookings: int
    total_bookings: int
    total_earnings: int


class ListingIn(BaseModel):
    """Body for creating or updating (full replace) a listing."""

    title: str = Field(min_length=5, max_length=120)
    description: str = Field(min_length=20, max_length=5000)
    property_type: PropertyType
    room_type: RoomType
    category_id: int | None = None
    address: str = Field(min_length=3, max_length=255)
    city: str = Field(min_length=2, max_length=100)
    state: str | None = Field(default=None, max_length=100)
    country: str = Field(min_length=2, max_length=100)
    latitude: float = Field(ge=-90, le=90)
    longitude: float = Field(ge=-180, le=180)
    price_per_night: int = Field(ge=10, le=50_000)
    cleaning_fee: int = Field(default=0, ge=0, le=5_000)
    max_guests: int = Field(ge=1, le=16)
    bedrooms: int = Field(ge=0, le=50)
    beds: int = Field(ge=1, le=50)
    bathrooms: float = Field(ge=0.5, le=50)
    amenity_ids: list[int] = Field(default_factory=list)
    image_urls: list[str] = Field(min_length=1, max_length=20)

    @field_validator("title", "description", "address", "city", "country")
    @classmethod
    def strip_text(cls, value: str) -> str:
        value = value.strip()
        if not value:
            raise ValueError("must not be blank")
        return value

    @field_validator("bathrooms")
    @classmethod
    def half_steps(cls, value: float) -> float:
        if (value * 2) % 1 != 0:
            raise ValueError("bathrooms must be a multiple of 0.5")
        return value

    @field_validator("image_urls")
    @classmethod
    def valid_image_urls(cls, urls: list[str]) -> list[str]:
        cleaned = [url.strip() for url in urls if url.strip()]
        for url in cleaned:
            if not url.startswith(("http://", "https://")) or len(url) > 1000:
                raise ValueError(f"not a valid image URL: {url[:60]}")
        if not cleaned:
            raise ValueError("add at least one photo")
        return cleaned


class DateRange(BaseModel):
    check_in: date
    check_out: date


class Availability(BaseModel):
    """Booked (unavailable) stays. Nights from check_in up to the day before check_out are taken."""

    listing_id: int
    booked: list[DateRange]


class Quote(BaseModel):
    """Price breakdown for a stay, plus whether it can actually be booked."""

    check_in: date
    check_out: date
    nights: int
    nightly_price: int
    subtotal: int
    cleaning_fee: int
    service_fee: int
    total: int
    available: bool
    message: str | None = None
