from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import CheckConstraint, ForeignKey, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base, utcnow

if TYPE_CHECKING:
    from app.models.booking import Booking
    from app.models.listing import Listing
    from app.models.user import User

# Category ratings shown on the listing page, next to the overall rating.
RATING_CATEGORIES = ("cleanliness", "accuracy", "checkin", "communication", "location", "value")


class Review(Base):
    """A guest's review of a stay. One review per booking (booking_id is unique)."""

    __tablename__ = "reviews"
    __table_args__ = tuple(
        CheckConstraint(f"{column} BETWEEN 1 AND 5", name=f"ck_reviews_{column}")
        for column in ("rating", *RATING_CATEGORIES)
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    listing_id: Mapped[int] = mapped_column(ForeignKey("listings.id"), index=True)
    author_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    booking_id: Mapped[int | None] = mapped_column(ForeignKey("bookings.id"), unique=True)

    rating: Mapped[int]  # overall, 1-5 stars
    cleanliness: Mapped[int]
    accuracy: Mapped[int]
    checkin: Mapped[int]
    communication: Mapped[int]
    location: Mapped[int]
    value: Mapped[int]
    comment: Mapped[str] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(default=utcnow)

    listing: Mapped["Listing"] = relationship(back_populates="reviews")
    author: Mapped["User"] = relationship()
    booking: Mapped["Booking | None"] = relationship(back_populates="review")
