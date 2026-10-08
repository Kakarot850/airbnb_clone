"""Bookings from the guest's side: reserve, list my trips, view one, cancel."""
from fastapi import APIRouter
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.deps import CurrentUser, DbSession
from app.models import Booking, Listing
from app.schemas.booking import BookingCreate, BookingOut
from app.services import booking_service

router = APIRouter(prefix="/bookings", tags=["bookings"])


@router.post("", response_model=BookingOut, status_code=201)
def create_booking(body: BookingCreate, user: CurrentUser, db: DbSession):
    return booking_service.create_booking(db, user, body)


@router.get("", response_model=list[BookingOut])
def my_trips(user: CurrentUser, db: DbSession):
    """All of the current user's bookings, newest stay first."""
    return db.scalars(
        select(Booking)
        .where(Booking.guest_id == user.id)
        .order_by(Booking.check_in.desc())
        .options(
            selectinload(Booking.listing).selectinload(Listing.images),
            selectinload(Booking.listing).selectinload(Listing.host),
            selectinload(Booking.guest),
            selectinload(Booking.review),
        )
    ).all()


@router.get("/{booking_id}", response_model=BookingOut)
def get_booking(booking_id: int, user: CurrentUser, db: DbSession):
    return booking_service.get_booking_for_user(db, booking_id, user)


@router.post("/{booking_id}/cancel", response_model=BookingOut)
def cancel_booking(booking_id: int, user: CurrentUser, db: DbSession):
    booking = booking_service.get_booking_for_user(db, booking_id, user)
    return booking_service.cancel_booking(db, booking)
