"""Test setup: every test gets a fresh in-memory SQLite database (with the overlap triggers)."""
import os

os.environ["SEED_ON_STARTUP"] = "false"  # must be set before the app is imported

from uuid import uuid4  # noqa: E402

import pytest  # noqa: E402
from fastapi.testclient import TestClient  # noqa: E402
from sqlalchemy import create_engine  # noqa: E402
from sqlalchemy.orm import sessionmaker  # noqa: E402
from sqlalchemy.pool import StaticPool  # noqa: E402

from app.database import get_db, init_db  # noqa: E402
from app.main import app  # noqa: E402
from app.models import Amenity, Booking, Category, Listing, ListingImage, User  # noqa: E402
from app.security import create_access_token  # noqa: E402
from app.services.pricing import calculate_price  # noqa: E402


@pytest.fixture
def db():
    engine = create_engine("sqlite://", connect_args={"check_same_thread": False}, poolclass=StaticPool)
    init_db(engine)
    session = sessionmaker(bind=engine, autoflush=False, expire_on_commit=False)()
    yield session
    session.close()
    engine.dispose()


@pytest.fixture
def client(db):
    def override_get_db():
        yield db

    app.dependency_overrides[get_db] = override_get_db
    yield TestClient(app)  # not used as a context manager, so startup seeding doesn't run
    app.dependency_overrides.clear()


def auth(user: User) -> dict:
    return {"Authorization": f"Bearer {create_access_token(user.id)}"}


@pytest.fixture
def make_user(db):
    def _make(name="Test User", is_host=False):
        user = User(name=name, email=f"{uuid4().hex[:10]}@test.com", is_host=is_host)
        db.add(user)
        db.commit()
        return user

    return _make


@pytest.fixture
def make_listing(db, make_user):
    def _make(host=None, amenities=(), category=None, **overrides):
        fields = dict(
            title="Test listing", description="A lovely place to stay while running tests.",
            property_type="House", room_type="entire_home", address="1 Test Street", city="Testville",
            state=None, country="Testland", latitude=10.0, longitude=20.0, price_per_night=100,
            cleaning_fee=50, max_guests=4, bedrooms=2, beds=2, bathrooms=1,
        )
        fields.update(overrides)
        listing = Listing(host=host or make_user("Host", is_host=True), category=category, **fields)
        listing.images = [ListingImage(url="https://example.com/photo.jpg", position=0)]
        listing.amenities = list(amenities)
        db.add(listing)
        db.commit()
        return listing

    return _make


@pytest.fixture
def make_booking(db):
    """Insert a booking directly (bypassing API rules) - handy for past stays."""

    def _make(listing, guest, check_in, check_out, status="confirmed"):
        price = calculate_price(listing.price_per_night, listing.cleaning_fee, check_in, check_out)
        booking = Booking(
            listing=listing, guest=guest, check_in=check_in, check_out=check_out, adults=1,
            nights=price.nights, nightly_price=price.nightly_price, cleaning_fee=price.cleaning_fee,
            service_fee=price.service_fee, total_price=price.total, status=status,
        )
        db.add(booking)
        db.commit()
        return booking

    return _make


@pytest.fixture
def amenity(db):
    def _make(name):
        item = Amenity(name=name, icon="wifi", group_name="Essentials")
        db.add(item)
        db.commit()
        return item

    return _make


@pytest.fixture
def category(db):
    item = Category(slug="cabins", name="Cabins", icon="tree-pine")
    db.add(item)
    db.commit()
    return item
