from typing import Generic, TypeVar

from pydantic import BaseModel

T = TypeVar("T")


class Page(BaseModel, Generic[T]):
    """A page of results plus the numbers the frontend needs for pagination / infinite scroll."""

    items: list[T]
    total: int
    page: int
    page_size: int
    total_pages: int
