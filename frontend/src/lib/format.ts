// Small display helpers shared by many components.
import { differenceInYears, format, parseISO } from "date-fns";
import type { GuestCounts, RoomType } from "./types";

export function formatPrice(amount: number): string {
  return `$${amount.toLocaleString("en-US")}`;
}

/** "Malibu, California" for US listings, "Kyoto, Japan" elsewhere (Airbnb style). */
export function formatLocation(place: { city: string; state: string | null; country: string }): string {
  if (place.country === "United States" && place.state) return `${place.city}, ${place.state}`;
  return `${place.city}, ${place.country}`;
}

/** 4.9 -> "4.9", 4.92 -> "4.92", 5 -> "5.0" */
export function formatRating(rating: number): string {
  return rating.toFixed(2).replace(/0$/, "");
}

export function plural(count: number, word: string, pluralWord = `${word}s`): string {
  return `${count} ${count === 1 ? word : pluralWord}`;
}

export function formatBathrooms(count: number): string {
  return plural(count, "bath");
}

/** "Entire villa", "Room in guesthouse", "Shared room in hostel" */
export function placeKind(roomType: RoomType, propertyType: string): string {
  const type = propertyType.toLowerCase();
  if (roomType === "private_room") return `Room in ${type}`;
  if (roomType === "shared_room") return `Shared room in ${type}`;
  return `Entire ${type}`;
}

export const ROOM_TYPE_LABELS: Record<RoomType, string> = {
  entire_home: "Entire home",
  private_room: "Private room",
  shared_room: "Shared room",
};

/** "2 guests, 1 infant, 1 pet" */
export function guestsSummary({ adults, children, infants, pets }: GuestCounts): string {
  const parts = [plural(adults + children, "guest")];
  if (infants) parts.push(plural(infants, "infant"));
  if (pets) parts.push(plural(pets, "pet"));
  return parts.join(", ");
}

/** "Oct 12 – 17", "Oct 30 – Nov 2", "Dec 30, 2026 – Jan 2, 2027" */
export function formatDateRange(checkIn: string, checkOut: string): string {
  const start = parseISO(checkIn);
  const end = parseISO(checkOut);
  if (start.getFullYear() !== end.getFullYear()) return `${format(start, "MMM d, yyyy")} – ${format(end, "MMM d, yyyy")}`;
  if (start.getMonth() === end.getMonth()) return `${format(start, "MMM d")} – ${format(end, "d")}`;
  return `${format(start, "MMM d")} – ${format(end, "MMM d")}`;
}

export function formatDate(date: string, pattern = "EEE, MMM d"): string {
  return format(parseISO(date), pattern);
}

export function yearsSince(date: string): number {
  return Math.max(differenceInYears(new Date(), parseISO(date)), 0);
}

/** "5 years on Airbnb" / "New to Airbnb" */
export function memberFor(date: string, suffix = "on Airbnb"): string {
  const years = yearsSince(date);
  return years < 1 ? "New to Airbnb" : `${plural(years, "year")} ${suffix}`;
}

/** Airbnb-style confirmation code from the booking id, e.g. HMX8Q2T4ZK */
export function confirmationCode(id: number): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let seed = id * 2654435761;
  let code = "HM";
  for (let i = 0; i < 8; i++) {
    seed = (seed * 1103515245 + 12345) % 2147483648;
    code += alphabet[seed % alphabet.length];
  }
  return code;
}
