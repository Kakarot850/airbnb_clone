from datetime import date, timedelta

import pytest
from sqlalchemy.exc import IntegrityError

from tests.conftest import auth

TODAY = date.today()


def days(n: int) -> str:
    return (TODAY + timedelta(days=n)).isoformat()


def book(client, user, listing, check_in, check_out, **extra):
    body = {"listing_id": listing.id, "check_in": check_in, "check_out": check_out, "adults": 2, **extra}
    return client.post("/api/bookings", json=body, headers=auth(user))


def test_booking_snapshots_the_price(client, make_user, make_listing):
    guest, listing = make_user(), make_listing(price_per_night=120, cleaning_fee=30)
    response = book(client, guest, listing, days(10), days(13))
    assert response.status_code == 201
    data = response.json()
    assert data["nights"] == 3
    assert data["total_price"] == 360 + 30 + round(360 * 0.14)
    assert data["trip_status"] == "upcoming"


def test_overlapping_dates_are_rejected(client, make_user, make_listing):
    listing = make_listing()
    assert book(client, make_user(), listing, days(10), days(15)).status_code == 201
    response = book(client, make_user(), listing, days(12), days(18))
    assert response.status_code == 409


def test_back_to_back_stays_are_allowed(client, make_user, make_listing):
    listing = make_listing()
    assert book(client, make_user(), listing, days(10), days(15)).status_code == 201
    assert book(client, make_user(), listing, days(15), days(17)).status_code == 201
    assert book(client, make_user(), listing, days(8), days(10)).status_code == 201


def test_cancelling_frees_the_dates(client, make_user, make_listing):
    guest, listing = make_user(), make_listing()
    booking_id = book(client, guest, listing, days(10), days(15)).json()["id"]
    cancel = client.post(f"/api/bookings/{booking_id}/cancel", headers=auth(guest))
    assert cancel.json()["status"] == "cancelled"
    assert book(client, make_user(), listing, days(10), days(15)).status_code == 201


@pytest.mark.parametrize(
    "check_in, check_out, extra, message",
    [
        (-2, 3, {}, "Check-in date can't be in the past."),
        (5, 5, {}, "Checkout must be after check-in."),
        (5, 200, {}, "Stays can be at most 90 nights."),
        (5, 8, {"adults": 3, "children": 2}, "This place has a maximum of 4 guests."),
    ],
)
def test_invalid_stays(client, make_user, make_listing, check_in, check_out, extra, message):
    body = {"adults": 2, **extra}
    response = book(client, make_user(), make_listing(), days(check_in), days(check_out), **body)
    assert response.status_code == 400
    assert response.json()["detail"] == message


def test_infants_do_not_count_towards_guest_limit(client, make_user, make_listing):
    response = book(client, make_user(), make_listing(max_guests=2), days(5), days(7), adults=2, infants=2)
    assert response.status_code == 201


def test_host_cannot_book_own_listing(client, make_user, make_listing):
    host = make_user(is_host=True)
    response = book(client, host, make_listing(host=host), days(5), days(7))
    assert response.status_code == 400


def test_login_required(client, make_listing):
    response = client.post("/api/bookings", json={"listing_id": make_listing().id, "check_in": days(5), "check_out": days(7)})
    assert response.status_code == 401


def test_only_guest_and_host_can_see_a_booking(client, make_user, make_listing):
    guest, listing = make_user(), make_listing()
    booking_id = book(client, guest, listing, days(5), days(7)).json()["id"]
    assert client.get(f"/api/bookings/{booking_id}", headers=auth(guest)).status_code == 200
    assert client.get(f"/api/bookings/{booking_id}", headers=auth(listing.host)).status_code == 200
    assert client.get(f"/api/bookings/{booking_id}", headers=auth(make_user())).status_code == 404


def test_database_trigger_blocks_overlaps(db, make_user, make_listing, make_booking):
    """Even if the API check is skipped (race condition), SQLite refuses the second booking."""
    listing = make_listing()
    make_booking(listing, make_user(), TODAY + timedelta(days=10), TODAY + timedelta(days=15))
    with pytest.raises(IntegrityError):
        make_booking(listing, make_user(), TODAY + timedelta(days=12), TODAY + timedelta(days=20))


def test_quote_reports_unavailable_dates(client, make_user, make_listing, make_booking):
    listing = make_listing()
    make_booking(listing, make_user(), TODAY + timedelta(days=10), TODAY + timedelta(days=15))
    quote = client.get(f"/api/listings/{listing.id}/quote", params={"check_in": days(12), "check_out": days(14)}).json()
    assert quote["available"] is False
    free = client.get(f"/api/listings/{listing.id}/quote", params={"check_in": days(15), "check_out": days(17)}).json()
    assert free["available"] is True and free["nights"] == 2


def test_availability_lists_booked_ranges(client, make_user, make_listing, make_booking):
    listing = make_listing()
    make_booking(listing, make_user(), TODAY + timedelta(days=3), TODAY + timedelta(days=6))
    make_booking(listing, make_user(), TODAY + timedelta(days=8), TODAY + timedelta(days=9), status="cancelled")
    booked = client.get(f"/api/listings/{listing.id}/availability").json()["booked"]
    assert booked == [{"check_in": days(3), "check_out": days(6)}]
