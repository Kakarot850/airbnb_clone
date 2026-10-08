"""Listings: search (with filters + pagination), detail, host CRUD, availability and price quotes."""
from datetime import date
from math import ceil

from fastapi import APIRouter, Query, Response
from sqlalchemy.orm import Session

from app.deps import CurrentUser, DbSession
from app.errors import BadRequest
from app.schemas.common import Page
from app.schemas.listing import Availability, DateRange, ListingCard, ListingDetail, ListingIn, Quote
from app.services import listing_service
from app.services.availability import booked_ranges
from app.services.booking_service import quote_stay
from app.services.listing_search import ListingFilters, search_listings
from app.services.pricing import calculate_price

router = APIRouter(prefix="/listings", tags=["listings"])


@router.get("", response_model=Page[ListingCard])
def search(
    db: DbSession,
    location: str | None = Query(default=None, max_length=100),
    check_in: date | None = None,
    check_out: date | None = None,
    guests: int | None = Query(default=None, ge=1, le=16),
    category: str | None = None,
    room_type: list[str] = Query(default=[]),
    property_type: list[str] = Query(default=[]),
    amenity: list[int] = Query(default=[]),
    min_price: int | None = Query(default=None, ge=0),
    max_price: int | None = Query(default=None, ge=0),
    bedrooms: int | None = Query(default=None, ge=0),
    beds: int | None = Query(default=None, ge=0),
    bathrooms: float | None = Query(default=None, ge=0),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=50),
):
    if check_in and check_out and check_out <= check_in:
        raise BadRequest("Checkout must be after check-in.")
    filters = ListingFilters(
        location=location,
        check_in=check_in,
        check_out=check_out,
        guests=guests,
        category=category,
        room_types=room_type,
        property_types=property_type,
        amenity_ids=amenity,
        min_price=min_price,
        max_price=max_price,
        min_bedrooms=bedrooms,
        min_beds=beds,
        min_bathrooms=bathrooms,
    )
    listings, total = search_listings(db, filters, page, page_size)

    items = []
    for listing in listings:
        card = ListingCard.model_validate(listing)
        if check_in and check_out:  # show the total for the searched stay, like Airbnb
            card.total_price = calculate_price(listing.price_per_night, listing.cleaning_fee, check_in, check_out).total
        items.append(card)
    return Page(items=items, total=total, page=page, page_size=page_size, total_pages=ceil(total / page_size))


@router.post("", response_model=ListingDetail, status_code=201)
def create_listing(body: ListingIn, user: CurrentUser, db: DbSession):
    listing = listing_service.create_listing(db, user, body)
    return listing_service.to_detail(db, listing)


@router.get("/{listing_id}", response_model=ListingDetail)
def get_listing(listing_id: int, db: DbSession):
    return listing_service.to_detail(db, listing_service.get_active_listing(db, listing_id))


@router.put("/{listing_id}", response_model=ListingDetail)
def update_listing(listing_id: int, body: ListingIn, user: CurrentUser, db: DbSession):
    listing = listing_service.get_owned_listing(db, listing_id, user)
    return listing_service.to_detail(db, listing_service.update_listing(db, listing, body))


@router.delete("/{listing_id}", status_code=204)
def delete_listing(listing_id: int, user: CurrentUser, db: DbSession):
    listing = listing_service.get_owned_listing(db, listing_id, user)
    listing_service.delete_listing(db, listing)
    return Response(status_code=204)


@router.get("/{listing_id}/availability", response_model=Availability)
def get_availability(listing_id: int, db: DbSession):
    listing_service.get_active_listing(db, listing_id)
    ranges = booked_ranges(db, listing_id, from_date=date.today())
    return Availability(listing_id=listing_id, booked=[DateRange(check_in=a, check_out=b) for a, b in ranges])


@router.get("/{listing_id}/quote", response_model=Quote)
def get_quote(listing_id: int, check_in: date, check_out: date, db: DbSession, guests: int = Query(default=1, ge=1)):
    listing = listing_service.get_active_listing(db, listing_id)
    return quote_stay(db, listing, check_in, check_out, guests)
