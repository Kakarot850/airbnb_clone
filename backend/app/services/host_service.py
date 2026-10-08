"""Host-facing data: Superhost status, dashboard listings with stats, reservations."""
from datetime import date

from sqlalchemy import case, func, select
from sqlalchemy.orm import Session, selectinload

from app.models import STATUS_CONFIRMED, Booking, Listing, User
from app.schemas.listing import HostListing, ListingCard
from app.schemas.user import HostProfile

SUPERHOST_MIN_RATING = 4.8
SUPERHOST_MIN_REVIEWS = 5


def host_profile(db: Session, host: User) -> HostProfile:
    """Aggregates the host's review stats across all of their active listings."""
    listing_count, review_count, rating_points = db.execute(
        select(
            func.count(Listing.id),
            func.coalesce(func.sum(Listing.review_count), 0),
            func.coalesce(func.sum(Listing.rating_avg * Listing.review_count), 0),
        ).where(Listing.host_id == host.id, Listing.deleted_at.is_(None))
    ).one()
    rating_avg = round(rating_points / review_count, 2) if review_count else 0.0
    return HostProfile(
        id=host.id,
        name=host.name,
        avatar_url=host.avatar_url,
        created_at=host.created_at,
        bio=host.bio,
        listing_count=listing_count,
        review_count=review_count,
        rating_avg=rating_avg,
        is_superhost=review_count >= SUPERHOST_MIN_REVIEWS and rating_avg >= SUPERHOST_MIN_RATING,
    )


def host_listings(db: Session, host: User) -> list[HostListing]:
    listings = db.scalars(
        select(Listing)
        .where(Listing.host_id == host.id, Listing.deleted_at.is_(None))
        .order_by(Listing.created_at.desc())
        .options(selectinload(Listing.images), selectinload(Listing.category))
    ).all()

    # One grouped query for the booking stats of all listings (avoids N+1 queries).
    # Host earnings = what the guest paid minus the guest service fee (that goes to "Airbnb").
    today = date.today()
    stats_rows = db.execute(
        select(
            Booking.listing_id,
            func.count(Booking.id),
            func.sum(case((Booking.check_in > today, 1), else_=0)),
            func.sum(Booking.total_price - Booking.service_fee),
        )
        .where(Booking.listing_id.in_([listing.id for listing in listings]), Booking.status == STATUS_CONFIRMED)
        .group_by(Booking.listing_id)
    ).all()
    stats = {row[0]: row[1:] for row in stats_rows}

    result = []
    for listing in listings:
        total, upcoming, earnings = stats.get(listing.id, (0, 0, 0))
        card = ListingCard.model_validate(listing).model_dump()
        result.append(
            HostListing(
                **card,
                cleaning_fee=listing.cleaning_fee,
                created_at=listing.created_at,
                updated_at=listing.updated_at,
                total_bookings=total or 0,
                upcoming_bookings=upcoming or 0,
                total_earnings=earnings or 0,
            )
        )
    return result


def host_bookings(db: Session, host: User, listing_id: int | None = None) -> list[Booking]:
    """Reservations made by guests on the host's listings, soonest first."""
    query = (
        select(Booking)
        .join(Booking.listing)
        .where(Listing.host_id == host.id)
        .order_by(Booking.check_in)
        .options(
            selectinload(Booking.listing).selectinload(Listing.images),
            selectinload(Booking.listing).selectinload(Listing.host),
            selectinload(Booking.guest),
            selectinload(Booking.review),
        )
    )
    if listing_id is not None:
        query = query.where(Booking.listing_id == listing_id)
    return list(db.scalars(query).all())
