"""Reviews: list a listing's reviews (with rating summary) and write a review after a stay."""
from fastapi import APIRouter
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.deps import CurrentUser, DbSession
from app.errors import NotFound
from app.models import Listing, Review
from app.schemas.review import ListingReviews, ReviewCreate, ReviewOut
from app.services.review_service import create_review, rating_summary

router = APIRouter(tags=["reviews"])


@router.get("/listings/{listing_id}/reviews", response_model=ListingReviews)
def listing_reviews(listing_id: int, db: DbSession):
    if db.get(Listing, listing_id) is None:
        raise NotFound("Listing not found.")
    reviews = db.scalars(
        select(Review)
        .where(Review.listing_id == listing_id)
        .order_by(Review.created_at.desc())
        .options(selectinload(Review.author))
    ).all()
    return ListingReviews(summary=rating_summary(db, listing_id), items=reviews)


@router.post("/reviews", response_model=ReviewOut, status_code=201)
def write_review(body: ReviewCreate, user: CurrentUser, db: DbSession):
    return create_review(db, user, body)
