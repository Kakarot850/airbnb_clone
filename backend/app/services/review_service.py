"""Reviews: writing one after a completed stay, and the rating aggregates shown on listings."""
from sqlalchemy import func, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.errors import BadRequest, Conflict, NotFound
from app.models import RATING_CATEGORIES, Booking, Listing, Review, User
from app.schemas.review import RatingSummary, ReviewCreate


def refresh_listing_rating(db: Session, listing_id: int) -> None:
    """Recompute the denormalized rating_avg / review_count columns of a listing."""
    average, count = db.execute(
        select(func.avg(Review.rating), func.count(Review.id)).where(Review.listing_id == listing_id)
    ).one()
    listing = db.get(Listing, listing_id)
    listing.rating_avg = round(average or 0, 2)
    listing.review_count = count


def rating_summary(db: Session, listing_id: int) -> RatingSummary:
    averages = db.execute(
        select(
            func.count(Review.id),
            func.avg(Review.rating),
            *(func.avg(getattr(Review, name)) for name in RATING_CATEGORIES),
        ).where(Review.listing_id == listing_id)
    ).one()
    count, overall, *category_averages = averages

    distribution = {str(stars): 0 for stars in range(5, 0, -1)}
    for stars, amount in db.execute(
        select(Review.rating, func.count(Review.id)).where(Review.listing_id == listing_id).group_by(Review.rating)
    ):
        distribution[str(stars)] = amount

    return RatingSummary(
        average=round(overall or 0, 2),
        count=count,
        distribution=distribution,
        **{name: round(value or 0, 1) for name, value in zip(RATING_CATEGORIES, category_averages)},
    )


def create_review(db: Session, author: User, data: ReviewCreate) -> Review:
    booking = db.get(Booking, data.booking_id)
    if booking is None or booking.guest_id != author.id:
        raise NotFound("Reservation not found.")
    if booking.trip_status != "completed":
        raise BadRequest("You can leave a review once your stay is over.")
    if booking.review is not None:
        raise Conflict("You already reviewed this stay.")

    review = Review(
        listing_id=booking.listing_id,
        author=author,
        booking=booking,
        rating=data.rating,
        comment=data.comment.strip(),
        # Category ratings are optional; default each one to the overall rating.
        **{name: getattr(data, name) or data.rating for name in RATING_CATEGORIES},
    )
    db.add(review)
    try:
        db.flush()
    except IntegrityError:  # unique booking_id: a duplicate review slipped through concurrently
        db.rollback()
        raise Conflict("You already reviewed this stay.")
    refresh_listing_rating(db, booking.listing_id)
    db.commit()
    return review
