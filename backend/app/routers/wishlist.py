"""Wishlist (favorites): the heart button on listing cards."""
from fastapi import APIRouter, Response
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.deps import CurrentUser, DbSession
from app.models import Favorite, Listing
from app.schemas.listing import ListingCard
from app.services.listing_service import get_active_listing

router = APIRouter(prefix="/wishlist", tags=["wishlist"])


@router.get("", response_model=list[ListingCard])
def my_wishlist(user: CurrentUser, db: DbSession):
    return db.scalars(
        select(Listing)
        .join(Favorite, Favorite.listing_id == Listing.id)
        .where(Favorite.user_id == user.id, Listing.deleted_at.is_(None))
        .order_by(Favorite.created_at.desc())
        .options(selectinload(Listing.images), selectinload(Listing.category))
    ).all()


@router.post("/{listing_id}", status_code=201)
def save_listing(listing_id: int, user: CurrentUser, db: DbSession):
    get_active_listing(db, listing_id)
    if db.get(Favorite, (user.id, listing_id)) is None:  # saving twice is harmless (idempotent)
        db.add(Favorite(user_id=user.id, listing_id=listing_id))
        db.commit()
    return {"listing_id": listing_id, "saved": True}


@router.delete("/{listing_id}", status_code=204)
def remove_listing(listing_id: int, user: CurrentUser, db: DbSession):
    favorite = db.get(Favorite, (user.id, listing_id))
    if favorite is not None:
        db.delete(favorite)
        db.commit()
    return Response(status_code=204)
