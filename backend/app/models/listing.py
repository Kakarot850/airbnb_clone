from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import CheckConstraint, Column, Float, ForeignKey, String, Table, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base, utcnow
from app.models.amenity import Amenity
from app.models.category import Category

if TYPE_CHECKING:
    from app.models.booking import Booking
    from app.models.review import Review
    from app.models.user import User

# Many-to-many link table between listings and amenities.
listing_amenities = Table(
    "listing_amenities",
    Base.metadata,
    Column("listing_id", ForeignKey("listings.id", ondelete="CASCADE"), primary_key=True),
    Column("amenity_id", ForeignKey("amenities.id", ondelete="CASCADE"), primary_key=True),
)

# A listing is a "Guest favorite" (badge on cards) when guests rate it this well.
GUEST_FAVORITE_MIN_RATING = 4.9
GUEST_FAVORITE_MIN_REVIEWS = 5


class ListingImage(Base):
    """One photo of a listing. `position` keeps the order chosen by the host (0 = cover photo)."""

    __tablename__ = "listing_images"

    id: Mapped[int] = mapped_column(primary_key=True)
    listing_id: Mapped[int] = mapped_column(ForeignKey("listings.id", ondelete="CASCADE"), index=True)
    url: Mapped[str] = mapped_column(String(1000))
    position: Mapped[int] = mapped_column(default=0)


class Listing(Base):
    """A place to stay, owned by a host."""

    __tablename__ = "listings"
    __table_args__ = (
        CheckConstraint("price_per_night > 0", name="ck_listings_price_positive"),
        CheckConstraint("cleaning_fee >= 0", name="ck_listings_cleaning_fee"),
        CheckConstraint("max_guests >= 1", name="ck_listings_max_guests"),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    host_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    category_id: Mapped[int | None] = mapped_column(ForeignKey("categories.id"), index=True)

    title: Mapped[str] = mapped_column(String(120))
    description: Mapped[str] = mapped_column(Text)
    property_type: Mapped[str] = mapped_column(String(30))  # House, Apartment, Cabin, ...
    room_type: Mapped[str] = mapped_column(String(20))  # entire_home | private_room | shared_room

    address: Mapped[str] = mapped_column(String(255))
    city: Mapped[str] = mapped_column(String(100), index=True)
    state: Mapped[str | None] = mapped_column(String(100))
    country: Mapped[str] = mapped_column(String(100), index=True)
    latitude: Mapped[float] = mapped_column(Float)
    longitude: Mapped[float] = mapped_column(Float)

    # Money is stored as whole US dollars (integers avoid floating point rounding issues).
    price_per_night: Mapped[int] = mapped_column(index=True)
    cleaning_fee: Mapped[int] = mapped_column(default=0)

    max_guests: Mapped[int]
    bedrooms: Mapped[int]
    beds: Mapped[int]
    bathrooms: Mapped[float] = mapped_column(Float)

    # Denormalized review stats (kept in sync by services/ratings.py) so search can
    # show and sort by rating without aggregating the reviews table on every request.
    rating_avg: Mapped[float] = mapped_column(Float, default=0)
    review_count: Mapped[int] = mapped_column(default=0)

    created_at: Mapped[datetime] = mapped_column(default=utcnow)
    updated_at: Mapped[datetime] = mapped_column(default=utcnow, onupdate=utcnow)
    # Soft delete: bookings and reviews keep pointing at deleted listings for history.
    deleted_at: Mapped[datetime | None] = mapped_column(default=None, index=True)

    host: Mapped["User"] = relationship(back_populates="listings")
    category: Mapped[Category | None] = relationship()
    images: Mapped[list[ListingImage]] = relationship(
        order_by=ListingImage.position, cascade="all, delete-orphan"
    )
    amenities: Mapped[list[Amenity]] = relationship(secondary=listing_amenities, order_by=Amenity.id)
    bookings: Mapped[list["Booking"]] = relationship(back_populates="listing")
    reviews: Mapped[list["Review"]] = relationship(back_populates="listing")

    @property
    def image_urls(self) -> list[str]:
        return [image.url for image in self.images]

    @property
    def cover_image_url(self) -> str | None:
        return self.images[0].url if self.images else None

    @property
    def is_guest_favorite(self) -> bool:
        return (
            self.review_count >= GUEST_FAVORITE_MIN_REVIEWS
            and self.rating_avg >= GUEST_FAVORITE_MIN_RATING
        )
