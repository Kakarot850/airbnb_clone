"""Booking rules: validation, availability, price snapshot, cancellation."""
from datetime import date

from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.database import utcnow
from app.errors import BadRequest, Conflict, NotFound
from app.models import STATUS_CANCELLED, Booking, Listing, User
from app.schemas.booking import BookingCreate
from app.schemas.listing import Quote
from app.services.availability import is_available
from app.services.listing_service import get_active_listing
from app.services.pricing import calculate_price

MAX_NIGHTS = 90
DATES_TAKEN_MESSAGE = "Those dates are not available. Please choose different dates."


def validate_stay(listing: Listing, check_in: date, check_out: date, guests: int, today: date | None = None) -> str | None:
    """Checks that don't need the database. Returns an error message, or None when valid."""
    today = today or date.today()
    if check_in < today:
        return "Check-in date can't be in the past."
    if check_out <= check_in:
        return "Checkout must be after check-in."
    if (check_out - check_in).days > MAX_NIGHTS:
        return f"Stays can be at most {MAX_NIGHTS} nights."
    if guests > listing.max_guests:
        return f"This place has a maximum of {listing.max_guests} guests."
    return None


def quote_stay(db: Session, listing: Listing, check_in: date, check_out: date, guests: int) -> Quote:
    """Price breakdown for the booking card, plus whether those dates can be booked."""
    if check_out <= check_in:
        raise BadRequest("Checkout must be after check-in.")
    price = calculate_price(listing.price_per_night, listing.cleaning_fee, check_in, check_out)
    message = validate_stay(listing, check_in, check_out, guests)
    if message is None and not is_available(db, listing.id, check_in, check_out):
        message = DATES_TAKEN_MESSAGE
    return Quote(
        check_in=check_in,
        check_out=check_out,
        nights=price.nights,
        nightly_price=price.nightly_price,
        subtotal=price.subtotal,
        cleaning_fee=price.cleaning_fee,
        service_fee=price.service_fee,
        total=price.total,
        available=message is None,
        message=message,
    )


def create_booking(db: Session, guest: User, data: BookingCreate) -> Booking:
    listing = get_active_listing(db, data.listing_id)
    if listing.host_id == guest.id:
        raise BadRequest("You can't book your own listing.")

    error = validate_stay(listing, data.check_in, data.check_out, data.adults + data.children)
    if error:
        raise BadRequest(error)
    if not is_available(db, listing.id, data.check_in, data.check_out):
        raise Conflict(DATES_TAKEN_MESSAGE)

    price = calculate_price(listing.price_per_night, listing.cleaning_fee, data.check_in, data.check_out)
    booking = Booking(
        listing=listing,
        guest=guest,
        check_in=data.check_in,
        check_out=data.check_out,
        adults=data.adults,
        children=data.children,
        infants=data.infants,
        pets=data.pets,
        nights=price.nights,
        nightly_price=price.nightly_price,
        cleaning_fee=price.cleaning_fee,
        service_fee=price.service_fee,
        total_price=price.total,
    )
    db.add(booking)
    try:
        db.commit()
    except IntegrityError:
        # The overlap trigger fired: another request booked these dates a moment ago.
        db.rollback()
        raise Conflict(DATES_TAKEN_MESSAGE)
    return booking


def get_booking_for_user(db: Session, booking_id: int, user: User) -> Booking:
    """Only the guest who booked and the listing's host may see a booking."""
    booking = db.get(Booking, booking_id)
    if booking is None or user.id not in (booking.guest_id, booking.listing.host_id):
        raise NotFound("Reservation not found.")
    return booking


def cancel_booking(db: Session, booking: Booking) -> Booking:
    """Guest or host cancels before the trip starts; the dates become available again."""
    if booking.status == STATUS_CANCELLED:
        raise BadRequest("This reservation is already cancelled.")
    if booking.check_in <= date.today():
        raise BadRequest("Trips that have already started can't be cancelled.")
    booking.status = STATUS_CANCELLED
    booking.cancelled_at = utcnow()
    db.commit()
    return booking
