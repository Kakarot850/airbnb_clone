from datetime import date

import pytest

from app.services.availability import ranges_overlap
from app.services.pricing import calculate_price


def test_price_breakdown():
    price = calculate_price(nightly_price=100, cleaning_fee=50, check_in=date(2030, 1, 1), check_out=date(2030, 1, 4))
    assert price.nights == 3
    assert price.subtotal == 300
    assert price.service_fee == 42  # 14% of 300
    assert price.total == 300 + 50 + 42


def test_price_needs_at_least_one_night():
    with pytest.raises(ValueError):
        calculate_price(100, 0, date(2030, 1, 1), date(2030, 1, 1))


@pytest.mark.parametrize(
    "a, b, expected",
    [
        ((1, 5), (3, 8), True),  # partial overlap
        ((1, 5), (2, 3), True),  # one inside the other
        ((1, 5), (1, 5), True),  # same dates
        ((1, 5), (5, 8), False),  # back-to-back: checkout day = next check-in day
        ((5, 8), (1, 5), False),
        ((1, 3), (6, 9), False),  # far apart
    ],
)
def test_ranges_overlap(a, b, expected):
    d = lambda day: date(2030, 1, day)  # noqa: E731
    assert ranges_overlap(d(a[0]), d(a[1]), d(b[0]), d(b[1])) is expected
