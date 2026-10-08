"use client";

import { format, parseISO } from "date-fns";
import DateRangePicker from "@/components/ui/DateRangePicker";
import { nightsBetween } from "@/lib/dates";
import { plural } from "@/lib/format";
import type { DateRange } from "@/lib/types";

interface CalendarSectionProps {
  city: string;
  booked: DateRange[];
  checkIn: string | null;
  checkOut: string | null;
  onChange: (checkIn: string | null, checkOut: string | null) => void;
}

/** The availability calendar in the listing page's left column. */
export default function CalendarSection({ city, booked, checkIn, checkOut, onChange }: CalendarSectionProps) {
  const title = checkIn && checkOut ? `${plural(nightsBetween(checkIn, checkOut), "night")} in ${city}` : checkIn ? "Select checkout date" : "Select check-in date";
  const subtitle =
    checkIn && checkOut
      ? `${format(parseISO(checkIn), "MMM d, yyyy")} - ${format(parseISO(checkOut), "MMM d, yyyy")}`
      : "Add your travel dates for exact pricing";
  return (
    <section id="calendar" className="border-t border-divider py-12">
      <h2 className="text-[22px] font-semibold">{title}</h2>
      <p className="mb-8 mt-1 text-sm text-muted">{subtitle}</p>
      <DateRangePicker checkIn={checkIn} checkOut={checkOut} onChange={onChange} booked={booked} />
      <div className="mt-4 flex items-center justify-between">
        <p className="text-xs text-muted">Crossed-out dates are already booked.</p>
        <button onClick={() => onChange(null, null)} className="rounded-lg px-2 py-1.5 text-sm font-semibold underline hover:bg-soft">
          Clear dates
        </button>
      </div>
    </section>
  );
}
