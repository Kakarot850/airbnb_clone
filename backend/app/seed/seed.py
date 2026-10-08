"""Fill the database with demo data.

    python -m app.seed      # wipe the database and seed it again

Dates are generated relative to today, so the demo always has upcoming trips,
past stays and blocked calendar dates. Randomness is seeded, so every run is identical.
"""
import random
from collections import defaultdict
from datetime import date, datetime, timedelta

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.database import Base, SessionLocal, engine, init_db
from app.models import (
    RATING_CATEGORIES, STATUS_CANCELLED, STATUS_CONFIRMED, Amenity, Booking, Category, Favorite, Listing,
    ListingImage, Review, User,
)
from app.seed import data
from app.services.availability import ranges_overlap
from app.services.pricing import calculate_price
from app.services.review_service import refresh_listing_rating


def photo_url(photo_id: str, width: int = 1200) -> str:
    return f"https://images.unsplash.com/photo-{photo_id}?auto=format&fit=crop&w={width}&q=80"


def avatar_url(photo_id: str | None) -> str | None:
    if photo_id is None:
        return None
    return f"https://images.unsplash.com/photo-{photo_id}?auto=format&fit=crop&crop=faces&w=200&h=200&q=80"


def build_gallery(spec: dict, index: int) -> list[str]:
    """The listing's own photos, completed to 6 with interior shots from the shared pools."""
    photos = list(spec["photos"])
    if not spec.get("fill", True):
        return photos
    if spec["property_type"] == "Hotel":
        pools = [data.BATHROOMS, data.HOTEL_ROOMS]
    else:
        pools = [data.LIVING_ROOMS, data.BEDROOMS, data.KITCHENS, data.BATHROOMS]
    step = 0
    while len(photos) < 6:
        pool = pools[step % len(pools)]
        candidate = pool[(index * 7 + step * 3) % len(pool)]
        if candidate not in photos:
            photos.append(candidate)
        step += 1
    return photos


def build_description(spec: dict) -> str:
    kind = spec["property_type"].lower()
    beds = f"{spec['beds']} bed" + ("s" if spec["beds"] != 1 else "")
    bedrooms = f"{spec['bedrooms']} bedroom" + ("s" if spec["bedrooms"] != 1 else "")
    baths = f"{spec['baths']:g} bathroom" + ("s" if spec["baths"] != 1 else "")
    if spec["room_type"] == "entire_home":
        access = "You'll have the whole place to yourself, including all common areas and outdoor spaces."
    else:
        access = "You'll have a private room with its own bathroom. Common areas may be shared with other guests."
    return (
        f"{spec['intro']}\n\n"
        f"The space\nThe {kind} has {bedrooms} with {beds} and {baths}, and comfortably sleeps up to "
        f"{spec['guests']} guests. Fresh linens, towels and toiletries are provided.\n\n"
        f"Guest access\n{access}\n\n"
        "Other things to note\nCheck-in is after 3:00 PM and checkout is before 11:00 AM. "
        "Please be respectful of the neighbors: no parties or events."
    )


def amenity_names(spec: dict, rng: random.Random) -> set[str]:
    names = set(spec["amenities"]) | {"Smoke alarm", "First aid kit"}
    if spec["property_type"] not in ("Tent", "Camper"):
        names.add("Wifi")
    if spec["room_type"] == "entire_home" and spec["property_type"] not in ("Tent", "Hotel"):
        names.add("Kitchen")
    extras = ["Washer", "TV", "Heating", "Fire extinguisher", "Carbon monoxide alarm", "Dedicated workspace", "Self check-in"]
    names |= set(rng.sample(extras, 3))
    return names


class Seeder:
    def __init__(self, db: Session):
        self.db = db
        self.rng = random.Random(42)
        self.today = date.today()
        self.now = datetime.now()
        self.users: dict[str, User] = {}
        self.listings: list[Listing] = []
        self.taken: dict[int, list[tuple[date, date]]] = defaultdict(list)  # listing id -> confirmed stays

    # ---- reference data, users, listings -------------------------------------------------
    def create_users(self) -> None:
        for key, info in (data.HOSTS | data.GUESTS).items():
            user = User(
                email=info["email"],
                name=info["name"],
                avatar_url=avatar_url(info["avatar"]),
                bio=info.get("bio"),
                is_host=key in data.HOSTS,
                created_at=self.now - timedelta(days=365 * info["years"] + self.rng.randint(0, 200)),
            )
            self.db.add(user)
            self.users[key] = user

    def create_listings(self) -> None:
        categories = {spec["slug"]: Category(**spec) for spec in data.CATEGORIES}
        amenities = {spec["name"]: Amenity(**spec) for spec in data.AMENITIES}
        self.db.add_all([*categories.values(), *amenities.values()])

        for index, spec in enumerate(data.LISTINGS):
            created = self.now - timedelta(days=self.rng.randint(800, 1500))
            listing = Listing(
                host=self.users[spec["host"]],
                category=categories[spec["category"]],
                title=spec["title"],
                description=build_description(spec),
                property_type=spec["property_type"],
                room_type=spec["room_type"],
                address=spec["address"],
                city=spec["city"],
                state=spec["state"],
                country=spec["country"],
                latitude=spec["lat"],
                longitude=spec["lng"],
                price_per_night=spec["price"],
                cleaning_fee=spec["cleaning_fee"],
                max_guests=spec["guests"],
                bedrooms=spec["bedrooms"],
                beds=spec["beds"],
                bathrooms=spec["baths"],
                created_at=created,
                updated_at=created,
            )
            listing.amenities = [amenities[name] for name in sorted(amenity_names(spec, self.rng))]
            listing.images = [
                ListingImage(url=photo_url(photo_id), position=position)
                for position, photo_id in enumerate(build_gallery(spec, index))
            ]
            self.db.add(listing)
            self.listings.append(listing)
        self.db.flush()  # assigns ids

    # ---- bookings & reviews -----------------------------------------------------------------
    def book(self, listing: Listing, guest: User, check_in: date, nights: int, adults: int = 2, children: int = 0,
             status: str = STATUS_CONFIRMED) -> Booking | None:
        """Create a booking unless it would overlap an existing confirmed stay."""
        check_out = check_in + timedelta(days=nights)
        if status == STATUS_CONFIRMED:
            if any(ranges_overlap(check_in, check_out, a, b) for a, b in self.taken[listing.id]):
                return None
            self.taken[listing.id].append((check_in, check_out))
        adults = max(1, min(adults, listing.max_guests))
        children = max(0, min(children, listing.max_guests - adults))
        price = calculate_price(listing.price_per_night, listing.cleaning_fee, check_in, check_out)
        booked_on = datetime.combine(check_in, datetime.min.time()) - timedelta(days=self.rng.randint(7, 60))
        booking = Booking(
            listing=listing, guest=guest, check_in=check_in, check_out=check_out, adults=adults, children=children,
            nights=price.nights, nightly_price=price.nightly_price, cleaning_fee=price.cleaning_fee,
            service_fee=price.service_fee, total_price=price.total, status=status,
            created_at=min(booked_on, self.now - timedelta(hours=1)),
            cancelled_at=(self.now - timedelta(days=2)) if status == STATUS_CANCELLED else None,
        )
        self.db.add(booking)
        return booking

    def review(self, booking: Booking, quality: float, comment: str | None = None) -> None:
        roll = self.rng.random()  # quality 4.9 -> ~93% five stars, ~6% four stars, ~1% three stars
        rating = 5 if roll < quality - 3.97 else (4 if roll < 0.99 else 3)
        host_first_name = booking.listing.host.name.split()[0]
        if comment is None:
            pool = data.REVIEW_COMMENTS if rating >= 4 else data.MIXED_COMMENTS
            comment = self.rng.choice(pool)
        scores = {name: max(1, rating - (1 if self.rng.random() < 0.1 else 0)) for name in RATING_CATEGORIES}
        self.db.add(Review(
            listing=booking.listing, author=booking.guest, booking=booking, rating=rating,
            comment=comment.format(host=host_first_name, city=booking.listing.city),
            created_at=datetime.combine(booking.check_out, datetime.min.time()) + timedelta(days=self.rng.randint(1, 6), hours=10),
            **scores,
        ))

    def listing(self, title_start: str) -> Listing:
        return next(listing for listing in self.listings if listing.title.startswith(title_start))

    def create_demo_scenarios(self) -> None:
        """Fixed bookings so the two demo accounts always have something to show."""
        alex, priya, rohan, emily = (self.users[k] for k in ("alex", "priya", "rohan", "emily"))
        t = self.today
        d = timedelta

        # Demo guest (guest@demo.com): upcoming trips, stays waiting for a review, reviewed stays, a cancellation.
        self.book(self.listing("Cliffside cave suite"), alex, t + d(days=21), 5)
        self.book(self.listing("Restored machiya"), alex, t + d(days=52), 4, adults=2, children=1)
        self.book(self.listing("Beach hut steps"), alex, t + d(days=9), 3)
        self.book(self.listing("Cozy log cabin"), alex, t - d(days=17), 5)
        self.book(self.listing("Bright apartment with Eiffel"), alex, t - d(days=49), 4)
        self.book(self.listing("Backwater houseboat"), alex, t - d(days=32), 2)
        self.review(self.book(self.listing("Skyline studio"), alex, t - d(days=128), 4), 5.0,
                    "Tiny but brilliantly designed studio. The view of Shibuya at night is unforgettable!")
        self.review(self.book(self.listing("Lakeside boathouse"), alex, t - d(days=241), 3), 5.0,
                    "A once in a lifetime stay. Waking up on the lake with those mountains was pure magic.")
        self.book(self.listing("Oceanfront villa"), alex, t + d(days=35), 4, status=STATUS_CANCELLED)

        # Demo host (host@demo.com): a guest staying right now plus several upcoming reservations.
        self.book(self.listing("Heritage haveli"), priya, t - d(days=1), 4)
        self.book(self.listing("Jungle villa"), emily, t + d(days=4), 6, adults=2, children=1)
        self.book(self.listing("Himalayan cottage"), rohan, t + d(days=14), 3, adults=3)
        self.book(self.listing("Coffee estate"), priya, t + d(days=27), 5, adults=4, children=2)

        # A few saved listings so the demo guest's wishlist isn't empty.
        for title in ("Medieval castle", "Overwater villa", "Treehouse hideaway", "Glass house", "Jungle villa"):
            self.db.add(Favorite(user_id=alex.id, listing_id=self.listing(title).id))

    def create_history(self) -> None:
        """Past stays with reviews, plus upcoming bookings that block calendar dates."""
        guests = [user for key, user in self.users.items() if key in data.GUESTS and key != "alex"]
        for listing, spec in zip(self.listings, data.LISTINGS):
            written = 0
            attempts = 0
            while written < spec["reviews"] and attempts < spec["reviews"] * 6:
                attempts += 1
                nights = self.rng.randint(2, 6)
                check_out = self.today - timedelta(days=self.rng.randint(5, 720))
                guest = self.rng.choice(guests)
                booking = self.book(listing, guest, check_out - timedelta(days=nights), nights,
                                    adults=self.rng.randint(1, 4), children=self.rng.randint(0, 2))
                if booking:
                    self.review(booking, spec["quality"])
                    written += 1

            for _ in range(self.rng.randint(2, 4)):  # upcoming reservations
                self.book(listing, self.rng.choice(guests), self.today + timedelta(days=self.rng.randint(2, 110)),
                          self.rng.randint(2, 6), adults=self.rng.randint(1, 3))
            if self.rng.random() < 0.3:  # an occasional cancellation
                self.book(listing, self.rng.choice(guests), self.today + timedelta(days=self.rng.randint(5, 60)),
                          3, status=STATUS_CANCELLED)

    def run(self) -> None:
        self.create_users()
        self.create_listings()
        self.create_demo_scenarios()
        self.create_history()
        self.db.flush()
        for listing in self.listings:
            refresh_listing_rating(self.db, listing.id)
        self.db.commit()


def seed_database(db: Session) -> None:
    Seeder(db).run()


def reset_database() -> None:
    Base.metadata.drop_all(bind=engine)
    init_db()
    with SessionLocal() as db:
        seed_database(db)


def seed_if_empty() -> None:
    """Used on startup: seed only when there are no users yet."""
    init_db()
    with SessionLocal() as db:
        if db.scalar(select(func.count(User.id))) == 0:
            seed_database(db)
