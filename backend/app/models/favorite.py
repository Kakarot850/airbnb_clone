from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base, utcnow

if TYPE_CHECKING:
    from app.models.listing import Listing


class Favorite(Base):
    """A listing saved to a user's wishlist (the heart button). The pair is the primary key."""

    __tablename__ = "favorites"

    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), primary_key=True)
    listing_id: Mapped[int] = mapped_column(
        ForeignKey("listings.id", ondelete="CASCADE"), primary_key=True
    )
    created_at: Mapped[datetime] = mapped_column(default=utcnow)

    listing: Mapped["Listing"] = relationship()
