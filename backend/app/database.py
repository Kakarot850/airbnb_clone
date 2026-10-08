"""Database engine, session factory and SQLite specific setup."""
import sqlite3
from datetime import datetime, timezone

from sqlalchemy import create_engine, event
from sqlalchemy.engine import Engine
from sqlalchemy.orm import DeclarativeBase, sessionmaker

from app.config import DATABASE_URL

# check_same_thread=False: FastAPI may use a session from a different thread than
# the one that created the connection (sync endpoints run in a thread pool).
engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(bind=engine, autoflush=False, expire_on_commit=False)


class Base(DeclarativeBase):
    """Base class for all ORM models."""


def utcnow() -> datetime:
    """Current UTC time as a naive datetime (SQLite has no timezone support)."""
    return datetime.now(timezone.utc).replace(tzinfo=None)


@event.listens_for(Engine, "connect")
def _enable_sqlite_foreign_keys(dbapi_connection, _connection_record):
    """SQLite ignores FOREIGN KEY constraints unless this pragma is enabled per connection."""
    if isinstance(dbapi_connection, sqlite3.Connection):
        cursor = dbapi_connection.cursor()
        cursor.execute("PRAGMA foreign_keys = ON")
        cursor.close()


def get_db():
    """FastAPI dependency: one session per request, always closed afterwards."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db(bind: Engine = engine) -> None:
    """Create all tables (and triggers) that don't exist yet."""
    from app import models  # noqa: F401  (importing registers every model on Base)

    Base.metadata.create_all(bind=bind)
