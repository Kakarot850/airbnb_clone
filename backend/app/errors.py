"""Readable HTTP errors used by routers and services: `raise NotFound("Listing not found")`.

FastAPI turns any HTTPException into a JSON response like {"detail": "Listing not found"}.
"""
from fastapi import HTTPException


class BadRequest(HTTPException):
    def __init__(self, detail: str):
        super().__init__(status_code=400, detail=detail)


class Unauthorized(HTTPException):
    def __init__(self, detail: str = "Please log in to continue."):
        super().__init__(status_code=401, detail=detail)


class Forbidden(HTTPException):
    def __init__(self, detail: str = "You don't have permission to do that."):
        super().__init__(status_code=403, detail=detail)


class NotFound(HTTPException):
    def __init__(self, detail: str = "Not found."):
        super().__init__(status_code=404, detail=detail)


class Conflict(HTTPException):
    def __init__(self, detail: str):
        super().__init__(status_code=409, detail=detail)
