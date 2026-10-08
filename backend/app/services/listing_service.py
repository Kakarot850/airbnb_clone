"""Create / read / update / delete listings (the host CRUD)."""
from datetime import date

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.database import utcnow
from app.errors import BadRequest, Conflict, Forbidden, NotFound
from app.models import STATUS_CANCELLED, STATUS_CONFIRMED, Amenity, Booking, Category, Listing, ListingImage, User
from app.schemas.listing import ListingCard, ListingDetail, ListingIn
from app.schemas.meta import AmenityOut
from app.services.host_service import host_profile


def get_active_listing(db: Session, listing_id: int) -> Listing:
    """A listing that hasn't been deleted, or 404."""
    listing = db.get(Listing, listing_id)
    if listing is None or listing.deleted_at is not None:
        raise NotFound("Listing not found.")
    return listing


def get_owned_listing(db: Session, listing_id: int, user: User) -> Listing:
    """A listing the user hosts, or 403/404."""
    listing = get_active_listing(db, listing_id)
    if listing.host_id != user.id:
        raise Forbidden("Only the host of this listing can change it.")
    return listing


def to_detail(db: Session, listing: Listing) -> ListingDetail:
    card = ListingCard.model_validate(listing).model_dump()
    return ListingDetail(
        **card,
        description=listing.description,
        address=listing.address,
        cleaning_fee=listing.cleaning_fee,
        amenities=[AmenityOut.model_validate(a) for a in listing.amenities],
        host=host_profile(db, listing.host),
        created_at=listing.created_at,
        updated_at=listing.updated_at,
    )


def _apply_listing_data(db: Session, listing: Listing, data: ListingIn) -> None:
    """Copy the form fields onto the listing, replacing amenities and photos."""
    if data.category_id is not None and db.get(Category, data.category_id) is None:
        raise BadRequest("Unknown category.")

    amenity_ids = set(data.amenity_ids)
    amenities = db.scalars(select(Amenity).where(Amenity.id.in_(amenity_ids))).all()
    if len(amenities) != len(amenity_ids):
        raise BadRequest("Unknown amenity.")

    for field, value in data.model_dump(exclude={"amenity_ids", "image_urls"}).items():
        setattr(listing, field, value)
    listing.amenities = list(amenities)
    listing.images = [ListingImage(url=url, position=i) for i, url in enumerate(data.image_urls)]


def create_listing(db: Session, host: User, data: ListingIn) -> Listing:
    listing = Listing(host=host)
    _apply_listing_data(db, listing, data)
    host.is_host = True  # listing a place is what makes someone a host
    db.add(listing)
    db.commit()
    return listing


def update_listing(db: Session, listing: Listing, data: ListingIn) -> Listing:
    _apply_listing_data(db, listing, data)
    db.commit()
    return listing


def delete_listing(db: Session, listing: Listing) -> int:
    """Soft-delete a listing and cancel its future reservations. Returns how many were cancelled.

    A listing with a guest staying right now can't be deleted.
    """
    today = date.today()
    active = db.scalars(
        select(Booking).where(
            Booking.listing_id == listing.id,
            Booking.status == STATUS_CONFIRMED,
            Booking.check_out > today,
        )
    ).all()
    if any(booking.check_in <= today for booking in active):
        raise Conflict("A guest is staying at this place right now. Try again after checkout.")

    now = utcnow()
    for booking in active:
        booking.status = STATUS_CANCELLED
        booking.cancelled_at = now
    listing.deleted_at = now
    db.commit()
    return len(active)
