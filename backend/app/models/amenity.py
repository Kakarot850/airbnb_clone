from sqlalchemy import String
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class Amenity(Base):
    """Something a listing offers (Wifi, Pool, ...). Linked to listings through `listing_amenities`."""

    __tablename__ = "amenities"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(80), unique=True)
    icon: Mapped[str] = mapped_column(String(50))
    group_name: Mapped[str] = mapped_column(String(50))  # Essentials, Features, Location, Safety
