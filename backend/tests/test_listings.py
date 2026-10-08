from datetime import date, timedelta

from tests.conftest import auth

TODAY = date.today()


def listing_body(**overrides):
    body = {
        "title": "Sunny loft downtown",
        "description": "Bright loft with big windows and a great view of the city.",
        "property_type": "Apartment",
        "room_type": "entire_home",
        "address": "5 Main St",
        "city": "Lisbon",
        "country": "Portugal",
        "latitude": 38.72,
        "longitude": -9.14,
        "price_per_night": 150,
        "cleaning_fee": 40,
        "max_guests": 3,
        "bedrooms": 1,
        "beds": 2,
        "bathrooms": 1,
        "amenity_ids": [],
        "image_urls": ["https://example.com/1.jpg", "https://example.com/2.jpg"],
    }
    body.update(overrides)
    return body


def search(client, **params):
    return client.get("/api/listings", params=params).json()


def test_search_by_location_and_guests(client, make_listing):
    make_listing(city="Goa", country="India", max_guests=2)
    make_listing(city="Paris", country="France", max_guests=6)
    assert [item["city"] for item in search(client, location="india")["items"]] == ["Goa"]
    assert [item["city"] for item in search(client, guests=4)["items"]] == ["Paris"]
    assert search(client, location="Goa, India")["total"] == 1


def test_search_hides_listings_booked_for_those_dates(client, make_user, make_listing, make_booking):
    busy, free = make_listing(title="Busy place"), make_listing(title="Free place")
    make_booking(busy, make_user(), TODAY + timedelta(days=10), TODAY + timedelta(days=14))
    params = {"check_in": (TODAY + timedelta(days=12)).isoformat(), "check_out": (TODAY + timedelta(days=16)).isoformat()}
    titles = [item["title"] for item in search(client, **params)["items"]]
    assert titles == ["Free place"]
    assert search(client, **params)["items"][0]["total_price"] is not None


def test_search_requires_all_selected_amenities(client, make_listing, amenity):
    wifi, pool = amenity("Wifi"), amenity("Pool")
    make_listing(title="Wifi only", amenities=[wifi])
    make_listing(title="Wifi and pool", amenities=[wifi, pool])
    params = [("amenity", wifi.id), ("amenity", pool.id)]
    data = client.get("/api/listings", params=params).json()
    assert [item["title"] for item in data["items"]] == ["Wifi and pool"]


def test_search_price_category_and_type_filters(client, make_listing, category):
    make_listing(title="Cheap cabin", price_per_night=80, property_type="Cabin", category=category)
    make_listing(title="Pricey house", price_per_night=400)
    assert [i["title"] for i in search(client, max_price=100)["items"]] == ["Cheap cabin"]
    assert [i["title"] for i in search(client, category="cabins")["items"]] == ["Cheap cabin"]
    assert [i["title"] for i in search(client, property_type="House")["items"]] == ["Pricey house"]


def test_pagination(client, make_listing):
    for n in range(5):
        make_listing(title=f"Listing {n}")
    page = search(client, page=2, page_size=2)
    assert page["total"] == 5 and page["total_pages"] == 3
    assert [item["title"] for item in page["items"]] == ["Listing 2", "Listing 3"]


def test_create_listing_turns_user_into_host(client, make_user, amenity):
    user, wifi = make_user(), amenity("Wifi")
    response = client.post("/api/listings", json=listing_body(amenity_ids=[wifi.id]), headers=auth(user))
    assert response.status_code == 201
    data = response.json()
    assert data["host"]["id"] == user.id
    assert data["image_urls"] == ["https://example.com/1.jpg", "https://example.com/2.jpg"]
    assert [a["name"] for a in data["amenities"]] == ["Wifi"]
    assert client.get("/api/auth/me", headers=auth(user)).json()["is_host"] is True


def test_listing_validation(client, make_user):
    response = client.post("/api/listings", json=listing_body(image_urls=[], price_per_night=0), headers=auth(make_user()))
    assert response.status_code == 422


def test_only_the_host_can_edit(client, make_user, make_listing):
    listing = make_listing()
    stranger = client.put(f"/api/listings/{listing.id}", json=listing_body(), headers=auth(make_user()))
    assert stranger.status_code == 403
    owner = client.put(f"/api/listings/{listing.id}", json=listing_body(title="Renamed loft"), headers=auth(listing.host))
    assert owner.status_code == 200 and owner.json()["title"] == "Renamed loft"


def test_delete_is_soft_and_cancels_future_bookings(client, db, make_user, make_listing, make_booking):
    listing = make_listing()
    past = make_booking(listing, make_user(), TODAY - timedelta(days=10), TODAY - timedelta(days=7))
    future = make_booking(listing, make_user(), TODAY + timedelta(days=7), TODAY + timedelta(days=9))

    assert client.delete(f"/api/listings/{listing.id}", headers=auth(listing.host)).status_code == 204
    assert client.get(f"/api/listings/{listing.id}").status_code == 404
    assert search(client)["total"] == 0
    db.refresh(past), db.refresh(future)
    assert past.status == "confirmed"  # history is kept
    assert future.status == "cancelled"


def test_cannot_delete_while_a_guest_is_staying(client, make_user, make_listing, make_booking):
    listing = make_listing()
    make_booking(listing, make_user(), TODAY - timedelta(days=1), TODAY + timedelta(days=2))
    assert client.delete(f"/api/listings/{listing.id}", headers=auth(listing.host)).status_code == 409


def test_wishlist(client, make_user, make_listing):
    user, listing = make_user(), make_listing()
    assert client.post(f"/api/wishlist/{listing.id}", headers=auth(user)).status_code == 201
    assert client.post(f"/api/wishlist/{listing.id}", headers=auth(user)).status_code == 201  # idempotent
    assert [item["id"] for item in client.get("/api/wishlist", headers=auth(user)).json()] == [listing.id]
    assert client.delete(f"/api/wishlist/{listing.id}", headers=auth(user)).status_code == 204
    assert client.get("/api/wishlist", headers=auth(user)).json() == []


def test_host_dashboard_stats(client, make_user, make_listing, make_booking):
    listing = make_listing(price_per_night=100, cleaning_fee=50)
    make_booking(listing, make_user(), TODAY + timedelta(days=5), TODAY + timedelta(days=7))
    stats = client.get("/api/host/listings", headers=auth(listing.host)).json()[0]
    assert stats["upcoming_bookings"] == 1 and stats["total_bookings"] == 1
    assert stats["total_earnings"] == 200 + 50  # guest service fee is not host income
    reservations = client.get("/api/host/bookings", headers=auth(listing.host)).json()
    assert len(reservations) == 1
