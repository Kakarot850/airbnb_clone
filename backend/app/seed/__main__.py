"""`python -m app.seed` resets the database and loads the demo data."""
from sqlalchemy import func, select

from app.database import SessionLocal
from app.models import Booking, Listing, Review, User
from app.seed.seed import reset_database

if __name__ == "__main__":
    reset_database()
    with SessionLocal() as db:
        counts = {model.__tablename__: db.scalar(select(func.count()).select_from(model)) for model in (User, Listing, Booking, Review)}
    print("Database seeded:", ", ".join(f"{n} {name}" for name, n in counts.items()))
    print("Demo guest: guest@demo.com   Demo host: host@demo.com")
