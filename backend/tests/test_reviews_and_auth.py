from datetime import date, timedelta

from tests.conftest import auth

TODAY = date.today()
REVIEW = {"rating": 4, "comment": "Great stay, very clean and comfortable."}


def test_review_after_stay_updates_listing_rating(client, make_user, make_listing, make_booking):
    guest, listing = make_user(), make_listing()
    booking = make_booking(listing, guest, TODAY - timedelta(days=5), TODAY - timedelta(days=2))

    response = client.post("/api/reviews", json={"booking_id": booking.id, **REVIEW, "cleanliness": 5}, headers=auth(guest))
    assert response.status_code == 201
    assert response.json()["cleanliness"] == 5 and response.json()["value"] == 4  # defaults to overall

    detail = client.get(f"/api/listings/{listing.id}").json()
    assert detail["rating_avg"] == 4 and detail["review_count"] == 1
    summary = client.get(f"/api/listings/{listing.id}/reviews").json()["summary"]
    assert summary["distribution"]["4"] == 1


def test_cannot_review_before_checkout_or_twice(client, make_user, make_listing, make_booking):
    guest, listing = make_user(), make_listing()
    upcoming = make_booking(listing, guest, TODAY + timedelta(days=5), TODAY + timedelta(days=8))
    assert client.post("/api/reviews", json={"booking_id": upcoming.id, **REVIEW}, headers=auth(guest)).status_code == 400

    past = make_booking(listing, guest, TODAY - timedelta(days=9), TODAY - timedelta(days=6))
    assert client.post("/api/reviews", json={"booking_id": past.id, **REVIEW}, headers=auth(guest)).status_code == 201
    assert client.post("/api/reviews", json={"booking_id": past.id, **REVIEW}, headers=auth(guest)).status_code == 409


def test_cannot_review_someone_elses_stay(client, make_user, make_listing, make_booking):
    booking = make_booking(make_listing(), make_user(), TODAY - timedelta(days=5), TODAY - timedelta(days=2))
    response = client.post("/api/reviews", json={"booking_id": booking.id, **REVIEW}, headers=auth(make_user()))
    assert response.status_code == 404


def test_signup_login_and_me(client):
    signup = client.post("/api/auth/signup", json={"email": "New@Example.com", "name": "New Person"})
    assert signup.status_code == 201
    assert signup.json()["user"]["email"] == "new@example.com"
    assert client.post("/api/auth/signup", json={"email": "new@example.com", "name": "Again"}).status_code == 409

    token = client.post("/api/auth/login", json={"email": "NEW@example.com"}).json()["token"]
    me = client.get("/api/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert me.json()["name"] == "New Person"
    assert client.post("/api/auth/login", json={"email": "nobody@example.com"}).status_code == 404
    assert client.get("/api/auth/me", headers={"Authorization": "Bearer not-a-token"}).status_code == 401
