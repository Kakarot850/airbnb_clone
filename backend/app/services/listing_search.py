"""Search & filters for the explore page. Each filter adds one WHERE condition."""
from dataclasses import dataclass, field
from datetime import date

from sqlalchemy import Select, exists, func, or_, select
from sqlalchemy.orm import Session, selectinload

from app.models import Amenity, Category, Listing
from app.services.availability import overlap_clause


@dataclass
class ListingFilters:
    location: str | None = None
    check_in: date | None = None
    check_out: date | None = None
    guests: int | None = None
    category: str | None = None  # category slug
    room_types: list[str] = field(default_factory=list)
    property_types: list[str] = field(default_factory=list)
    amenity_ids: list[int] = field(default_factory=list)  # listing must have ALL of them
    min_price: int | None = None
    max_price: int | None = None
    min_bedrooms: int | None = None
    min_beds: int | None = None
    min_bathrooms: float | None = None


def build_search_query(filters: ListingFilters) -> Select:
    query = select(Listing).where(Listing.deleted_at.is_(None))

    if filters.location:
        # "Palolem, Goa" -> every comma separated part must match the city, state or country.
        for part in (p.strip() for p in filters.location.split(",")):
            if part:
                query = query.where(
                    or_(
                        Listing.city.icontains(part, autoescape=True),
                        Listing.state.icontains(part, autoescape=True),
                        Listing.country.icontains(part, autoescape=True),
                    )
                )

    if filters.check_in and filters.check_out:
        # Hide listings that have a confirmed booking overlapping the requested stay.
        query = query.where(~exists().where(overlap_clause(Listing.id, filters.check_in, filters.check_out)))

    if filters.guests:
        query = query.where(Listing.max_guests >= filters.guests)
    if filters.category:
        query = query.where(Listing.category.has(Category.slug == filters.category))
    if filters.room_types:
        query = query.where(Listing.room_type.in_(filters.room_types))
    if filters.property_types:
        query = query.where(Listing.property_type.in_(filters.property_types))
    for amenity_id in filters.amenity_ids:
        query = query.where(Listing.amenities.any(Amenity.id == amenity_id))
    if filters.min_price is not None:
        query = query.where(Listing.price_per_night >= filters.min_price)
    if filters.max_price is not None:
        query = query.where(Listing.price_per_night <= filters.max_price)
    if filters.min_bedrooms:
        query = query.where(Listing.bedrooms >= filters.min_bedrooms)
    if filters.min_beds:
        query = query.where(Listing.beds >= filters.min_beds)
    if filters.min_bathrooms:
        query = query.where(Listing.bathrooms >= filters.min_bathrooms)
    return query


def search_listings(db: Session, filters: ListingFilters, page: int, page_size: int) -> tuple[list[Listing], int]:
    """Returns one page of matching listings and the total number of matches."""
    query = build_search_query(filters)
    total = db.scalar(select(func.count()).select_from(query.subquery()))
    listings = db.scalars(
        query.order_by(Listing.id)
        .offset((page - 1) * page_size)
        .limit(page_size)
        .options(selectinload(Listing.images), selectinload(Listing.category))
    ).all()
    return list(listings), total
