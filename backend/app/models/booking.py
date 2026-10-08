from datetime import date, datetime
from typing import TYPE_CHECKING

from sqlalchemy import DDL, CheckConstraint, Date, ForeignKey, Index, String, event
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base, utcnow

if TYPE_CHECKING:
    from app.models.listing import Listing
    from app.models.review import Review
    from app.models.user import User

STATUS_CONFIRMED = "confirmed"
STATUS_CANCELLED = "cancelled"


class Booking(Base):
    """A reservation of a listing for the nights [check_in, check_out).

    Prices are copied ("snapshotted") from the listing when booking, so later price
    changes by the host never change what a guest already agreed to pay.
    """

    __tablename__ = "bookings"
    __table_args__ = (
        CheckConstraint("check_out > check_in", name="ck_bookings_dates"),
        CheckConstraint("adults >= 1", name="ck_bookings_adults"),
        CheckConstraint("status IN ('confirmed', 'cancelled')", name="ck_bookings_status"),
        # Speeds up the availability check: "bookings of listing X overlapping these dates".
        Index("ix_bookings_listing_dates", "listing_id", "check_in", "check_out"),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    listing_id: Mapped[int] = mapped_column(ForeignKey("listings.id"), index=True)
    guest_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)

    check_in: Mapped[date] = mapped_column(Date)
    check_out: Mapped[date] = mapped_column(Date)

    adults: Mapped[int] = mapped_column(default=1)
    children: Mapped[int] = mapped_column(default=0)
    infants: Mapped[int] = mapped_column(default=0)
    pets: Mapped[int] = mapped_column(default=0)

    nights: Mapped[int]
    nightly_price: Mapped[int]
    cleaning_fee: Mapped[int]
    service_fee: Mapped[int]
    total_price: Mapped[int]

    status: Mapped[str] = mapped_column(String(20), default=STATUS_CONFIRMED)
    created_at: Mapped[datetime] = mapped_column(default=utcnow)
    cancelled_at: Mapped[datetime | None] = mapped_column(default=None)

    listing: Mapped["Listing"] = relationship(back_populates="bookings")
    guest: Mapped["User"] = relationship(back_populates="bookings")
    review: Mapped["Review | None"] = relationship(back_populates="booking")

    @property
    def guests(self) -> int:
        """Infants and pets don't count towards the listing's guest limit (same as Airbnb)."""
        return self.adults + self.children

    @property
    def trip_status(self) -> str:
        """upcoming | current | completed | cancelled (derived from status + today's date)."""
        if self.status == STATUS_CANCELLED:
            return "cancelled"
        today = date.today()
        if self.check_out <= today:
            return "completed"
        if self.check_in <= today:
            return "current"
        return "upcoming"

    @property
    def has_review(self) -> bool:
        return self.review is not None


# Database-level guarantee that two confirmed bookings of the same listing never overlap.
# The API checks availability first (to return a friendly 409), but this trigger is the
# safety net for race conditions: SQLite runs it while holding the database write lock.
# Two stays overlap when: existing.check_in < new.check_out AND existing.check_out > new.check_in
_OVERLAP_CONDITION = """
    SELECT RAISE(ABORT, 'Booking overlaps an existing reservation')
    WHERE EXISTS (
        SELECT 1 FROM bookings b
        WHERE b.listing_id = NEW.listing_id
          AND b.id IS NOT NEW.id
          AND b.status = 'confirmed'
          AND b.check_in < NEW.check_out
          AND b.check_out > NEW.check_in
    );
"""

for _ddl in (
    f"""CREATE TRIGGER IF NOT EXISTS trg_bookings_no_overlap_insert
        BEFORE INSERT ON bookings FOR EACH ROW WHEN NEW.status = 'confirmed'
        BEGIN {_OVERLAP_CONDITION} END;""",
    f"""CREATE TRIGGER IF NOT EXISTS trg_bookings_no_overlap_update
        BEFORE UPDATE OF listing_id, check_in, check_out, status ON bookings
        FOR EACH ROW WHEN NEW.status = 'confirmed'
        BEGIN {_OVERLAP_CONDITION} END;""",
):
    event.listen(Booking.__table__, "after_create", DDL(_ddl).execute_if(dialect="sqlite"))
