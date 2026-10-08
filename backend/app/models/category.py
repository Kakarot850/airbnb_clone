from sqlalchemy import String
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class Category(Base):
    """Explore categories shown in the icon row on the home page (Beachfront, Cabins, ...)."""

    __tablename__ = "categories"

    id: Mapped[int] = mapped_column(primary_key=True)
    slug: Mapped[str] = mapped_column(String(50), unique=True, index=True)
    name: Mapped[str] = mapped_column(String(50))
    icon: Mapped[str] = mapped_column(String(50))  # icon key, mapped to an SVG icon by the frontend
