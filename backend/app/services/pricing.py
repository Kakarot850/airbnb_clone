"""How much a stay costs. Change fees here and every page/endpoint picks it up."""
from dataclasses import dataclass
from datetime import date

SERVICE_FEE_RATE = 0.14  # Airbnb-style guest service fee: 14% of the nightly subtotal


@dataclass(frozen=True)
class PriceBreakdown:
    nights: int
    nightly_price: int
    subtotal: int  # nightly_price x nights
    cleaning_fee: int
    service_fee: int
    total: int


def calculate_price(nightly_price: int, cleaning_fee: int, check_in: date, check_out: date) -> PriceBreakdown:
    nights = (check_out - check_in).days
    if nights <= 0:
        raise ValueError("check_out must be after check_in")
    subtotal = nightly_price * nights
    service_fee = round(subtotal * SERVICE_FEE_RATE)
    return PriceBreakdown(
        nights=nights,
        nightly_price=nightly_price,
        subtotal=subtotal,
        cleaning_fee=cleaning_fee,
        service_fee=service_fee,
        total=subtotal + cleaning_fee + service_fee,
    )
