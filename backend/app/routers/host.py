"""Host dashboard data: my listings (with stats) and the reservations guests made on them."""
from fastapi import APIRouter

from app.deps import CurrentUser, DbSession
from app.schemas.booking import BookingOut
from app.schemas.listing import HostListing
from app.services import host_service

router = APIRouter(prefix="/host", tags=["host"])


@router.get("/listings", response_model=list[HostListing])
def my_listings(user: CurrentUser, db: DbSession):
    return host_service.host_listings(db, user)


@router.get("/bookings", response_model=list[BookingOut])
def my_reservations(user: CurrentUser, db: DbSession, listing_id: int | None = None):
    return host_service.host_bookings(db, user, listing_id)
