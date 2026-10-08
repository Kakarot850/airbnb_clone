from pydantic import BaseModel, ConfigDict


class CategoryOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    slug: str
    name: str
    icon: str


class AmenityOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    icon: str
    group_name: str


class LocationSuggestion(BaseModel):
    city: str
    state: str | None
    country: str
    listing_count: int


class PriceHistogram(BaseModel):
    """Nightly price distribution used by the price slider in the Filters modal."""

    min_price: int
    max_price: int
    buckets: list[int]  # number of listings per equal-width price bucket
