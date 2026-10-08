"""Lookup data for the UI: categories row, amenities, destination suggestions, price histogram."""
from fastapi import APIRouter, Query
from sqlalchemy import func, or_, select

from app.deps import DbSession
from app.models import Amenity, Category, Listing
from app.schemas.meta import AmenityOut, CategoryOut, LocationSuggestion, PriceHistogram

router = APIRouter(tags=["meta"])

HISTOGRAM_BUCKETS = 30


@router.get("/categories", response_model=list[CategoryOut])
def list_categories(db: DbSession):
    return db.scalars(select(Category).order_by(Category.id)).all()


@router.get("/amenities", response_model=list[AmenityOut])
def list_amenities(db: DbSession):
    return db.scalars(select(Amenity).order_by(Amenity.id)).all()


@router.get("/locations", response_model=list[LocationSuggestion])
def suggest_locations(db: DbSession, q: str | None = Query(default=None, max_length=100), limit: int = Query(default=8, le=20)):
    """Destinations that have listings, most popular first (powers the "Where" dropdown)."""
    query = (
        select(Listing.city, Listing.state, Listing.country, func.count(Listing.id).label("listing_count"))
        .where(Listing.deleted_at.is_(None))
        .group_by(Listing.city, Listing.state, Listing.country)
        .order_by(func.count(Listing.id).desc(), Listing.city)
        .limit(limit)
    )
    if q and q.strip():
        term = q.strip()
        query = query.where(
            or_(
                Listing.city.icontains(term, autoescape=True),
                Listing.state.icontains(term, autoescape=True),
                Listing.country.icontains(term, autoescape=True),
            )
        )
    return [LocationSuggestion(**row._mapping) for row in db.execute(query)]


@router.get("/price-histogram", response_model=PriceHistogram)
def price_histogram(db: DbSession):
    prices = db.scalars(select(Listing.price_per_night).where(Listing.deleted_at.is_(None))).all()
    if not prices:
        return PriceHistogram(min_price=0, max_price=0, buckets=[])
    low, high = min(prices), max(prices)
    width = max((high - low) / HISTOGRAM_BUCKETS, 1)
    buckets = [0] * HISTOGRAM_BUCKETS
    for price in prices:
        buckets[min(int((price - low) / width), HISTOGRAM_BUCKETS - 1)] += 1
    return PriceHistogram(min_price=low, max_price=high, buckets=buckets)
