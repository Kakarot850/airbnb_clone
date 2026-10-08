// Mock card validation for the checkout form. Card details never leave the browser.

export interface CardForm {
  number: string;
  expiry: string;
  cvv: string;
  zip: string;
  country: string;
}

/** Luhn checksum: the standard check digit algorithm used by card numbers. */
function passesLuhn(digits: string): boolean {
  let sum = 0;
  let double = false;
  for (let i = digits.length - 1; i >= 0; i--) {
    let digit = Number(digits[i]);
    if (double) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }
    sum += digit;
    double = !double;
  }
  return sum % 10 === 0;
}

export function validateCard(card: CardForm, now = new Date()): Partial<Record<keyof CardForm, string>> {
  const errors: Partial<Record<keyof CardForm, string>> = {};
  const digits = card.number.replace(/\s/g, "");
  if (!/^\d{13,19}$/.test(digits) || !passesLuhn(digits)) errors.number = "Check your card number.";

  const match = card.expiry.match(/^(\d{2})\s*\/\s*(\d{2})$/);
  if (!match) errors.expiry = "Use MM/YY.";
  else {
    const month = Number(match[1]);
    const year = 2000 + Number(match[2]);
    const endOfMonth = new Date(year, month, 0, 23, 59, 59);
    if (month < 1 || month > 12 || endOfMonth < now) errors.expiry = "This card has expired.";
  }

  if (!/^\d{3,4}$/.test(card.cvv)) errors.cvv = "Check your CVV.";
  if (card.zip.trim().length < 3) errors.zip = "Enter your ZIP code.";
  return errors;
}

/** "4242424242424242" -> "4242 4242 4242 4242" while typing. */
export function formatCardNumber(value: string): string {
  return value.replace(/\D/g, "").slice(0, 19).replace(/(\d{4})(?=\d)/g, "$1 ");
}

/** "1228" -> "12/28" while typing. */
export function formatExpiry(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 4);
  return digits.length > 2 ? `${digits.slice(0, 2)}/${digits.slice(2)}` : digits;
}
