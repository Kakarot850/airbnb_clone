"""FastAPI application: middleware, routers, static uploads and startup tasks.

Run locally with:  uvicorn app.main:app --reload
Interactive API docs: http://localhost:8000/docs
"""
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.config import CORS_ORIGINS, SEED_ON_STARTUP, UPLOAD_DIR
from app.database import init_db
from app.routers import auth, bookings, host, listings, meta, reviews, uploads, wishlist


@asynccontextmanager
async def lifespan(_app: FastAPI):
    init_db()
    if SEED_ON_STARTUP:
        from app.seed.seed import seed_if_empty

        seed_if_empty()
    yield


app = FastAPI(title="Airbnb Clone API", version="1.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_methods=["*"],
    allow_headers=["*"],
)

for module in (auth, meta, listings, reviews, bookings, wishlist, host, uploads):
    app.include_router(module.router, prefix="/api")

UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")


@app.get("/api/health", tags=["meta"])
def health():
    return {"status": "ok"}
