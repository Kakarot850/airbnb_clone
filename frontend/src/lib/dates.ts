// Date helpers for calendars and bookings. Dates travel as "YYYY-MM-DD" strings.
import { addDays, format, parseISO } from "date-fns";
import type { DateRange } from "./types";

export function toISODate(date: Date): string {
  return format(date, "yyyy-MM-dd");
}

export function todayISO(): string {
  return toISODate(new Date());
}

export function addDaysISO(date: string, days: number): string {
  return toISODate(addDays(parseISO(date), days));
}

export function nightsBetween(checkIn: string, checkOut: string): number {
  return Math.round((parseISO(checkOut).getTime() - parseISO(checkIn).getTime()) / 86_400_000);
}

/** Is the night starting on `day` taken? A stay [check_in, check_out) occupies check_in .. check_out - 1. */
export function isNightBooked(day: string, booked: DateRange[]): boolean {
  return booked.some((range) => range.check_in <= day && day < range.check_out);
}

/** Can someone stay from `checkIn` to `checkOut`? (no booked night in between) */
export function isRangeFree(checkIn: string, checkOut: string, booked: DateRange[]): boolean {
  return booked.every((range) => !(range.check_in < checkOut && range.check_out > checkIn));
}
