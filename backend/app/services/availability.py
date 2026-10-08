"""Is a listing free for some dates?

A stay is the half-open range [check_in, check_out): the guest sleeps the nights from
check_in up to the day before check_out. So the next guest may check in on the day the
previous guest checks out. Two stays overlap when each one starts before the other ends.
"""
from datetime import date

from sqlalchemy import and_, exists, select
from sqlalchemy.orm import Session

from app.models import STATUS_CONFIRMED, Booking


def ranges_overlap(start_a: date, end_a: date, start_b: date, end_b: date) -> bool:
    return start_a < end_b and start_b < end_a


def overlap_clause(listing_id, check_in: date, check_out: date):
    """SQL condition: a confirmed booking of `listing_id` overlapping [check_in, check_out).

    `listing_id` can be a number or a column (Listing.id) for correlated subqueries in search.
    """
    return and_(
        Booking.listing_id == listing_id,
        Booking.status == STATUS_CONFIRMED,
        Booking.check_in < check_out,
        Booking.check_out > check_in,
    )


def is_available(db: Session, listing_id: int, check_in: date, check_out: date) -> bool:
    has_overlap = db.scalar(select(exists().where(overlap_clause(listing_id, check_in, check_out))))
    return not has_overlap


def booked_ranges(db: Session, listing_id: int, from_date: date) -> list[tuple[date, date]]:
    """Confirmed stays that end after `from_date` (what the calendar must show as unavailable)."""
    rows = db.execute(
        select(Booking.check_in, Booking.check_out)
        .where(
            Booking.listing_id == listing_id,
            Booking.status == STATUS_CONFIRMED,
            Booking.check_out > from_date,
        )
        .order_by(Booking.check_in)
    ).all()
    return [(row.check_in, row.check_out) for row in rows]
