"use client";

import { addMonths, endOfMonth, format, getDay, parseISO, startOfMonth } from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/cn";
import { isNightBooked, isRangeFree, toISODate, todayISO } from "@/lib/dates";
import type { DateRange } from "@/lib/types";

interface DateRangePickerProps {
  checkIn: string | null;
  checkOut: string | null;
  onChange: (checkIn: string | null, checkOut: string | null) => void;
  booked?: DateRange[]; // stays that are already reserved (their nights can't be picked)
  months?: 1 | 2; // how many months are visible side by side
}

const WEEKDAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
const MONTHS_AHEAD = 12; // how far into the future guests can book

/**
 * Airbnb's two-month range calendar.
 * - First click picks check-in, second click picks checkout.
 * - Booked nights are struck through. After picking check-in, checkout can't go past the next booked night.
 */
export default function DateRangePicker({ checkIn, checkOut, onChange, booked = [], months = 2 }: DateRangePickerProps) {
  const today = todayISO();
  const currentMonth = startOfMonth(new Date());
  const [firstMonth, setFirstMonth] = useState(() => startOfMonth(checkIn ? parseISO(checkIn) : new Date()));
  const [hovered, setHovered] = useState<string | null>(null);

  const choosingCheckout = checkIn !== null && checkOut === null;
  const lastFirstMonth = addMonths(currentMonth, MONTHS_AHEAD - months);

  function isSelectable(day: string): boolean {
    if (day < today) return false;
    if (choosingCheckout && day > checkIn) return isRangeFree(checkIn, day, booked); // every night until `day` must be free
    return !isNightBooked(day, booked); // a new check-in needs a free night
  }

  function select(day: string) {
    if (!choosingCheckout || day <= checkIn!) onChange(day, null);
    else onChange(checkIn, day);
  }

  // While choosing checkout, hovering previews the range.
  const rangeEnd = checkOut ?? (choosingCheckout && hovered && hovered > checkIn && isSelectable(hovered) ? hovered : null);

  function renderDay(day: string) {
    const selectable = isSelectable(day);
    const isStart = day === checkIn;
    const isEnd = day === rangeEnd;
    const inRange = checkIn !== null && rangeEnd !== null && day > checkIn && day < rangeEnd;
    const booked_ = day >= today && !selectable && !isStart;

    return (
      <div
        key={day}
        className={cn(
          "flex h-11 items-center justify-center",
          inRange && "bg-soft",
          isStart && rangeEnd && "bg-[linear-gradient(to_right,transparent_50%,var(--color-soft)_50%)]",
          isEnd && checkIn && "bg-[linear-gradient(to_right,var(--color-soft)_50%,transparent_50%)]",
        )}
      >
        <button
          type="button"
          disabled={!selectable}
          onClick={() => select(day)}
          onMouseEnter={() => setHovered(day)}
          aria-label={format(parseISO(day), "EEEE, MMMM d, yyyy")}
          aria-pressed={isStart || isEnd}
          className={cn(
            "h-11 w-11 rounded-full text-sm font-semibold transition-shadow",
            isStart || isEnd ? "bg-ink text-canvas" : selectable ? "hover:ring-1 hover:ring-ink" : "cursor-default text-faint",
            booked_ && !isEnd && "line-through",
          )}
        >
          {Number(day.slice(8))}
        </button>
      </div>
    );
  }

  function renderMonth(month: Date) {
    const blanks = getDay(month); // weekday of the 1st (0 = Sunday)
    const days = Array.from({ length: endOfMonth(month).getDate() }, (_, i) =>
      toISODate(new Date(month.getFullYear(), month.getMonth(), i + 1)),
    );
    return (
      <div key={month.toISOString()} className="w-full min-w-0">
        <h3 className="mb-5 text-center text-base font-semibold">{format(month, "MMMM yyyy")}</h3>
        <div className="mb-2 grid grid-cols-7 text-center text-xs font-semibold text-muted">
          {WEEKDAYS.map((weekday) => (
            <span key={weekday}>{weekday}</span>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-y-0.5" onMouseLeave={() => setHovered(null)}>
          {Array.from({ length: blanks }, (_, i) => (
            <span key={`blank-${i}`} />
          ))}
          {days.map(renderDay)}
        </div>
      </div>
    );
  }

  const navButton = "absolute top-[-6px] flex h-8 w-8 items-center justify-center rounded-full hover:bg-soft disabled:opacity-0";
  return (
    <div className="relative">
      <button
        type="button"
        className={cn(navButton, "left-0")}
        onClick={() => setFirstMonth((month) => addMonths(month, -1))}
        disabled={firstMonth <= currentMonth}
        aria-label="Previous month"
      >
        <ChevronLeft className="h-4 w-4" strokeWidth={2.5} />
      </button>
      <button
        type="button"
        className={cn(navButton, "right-0")}
        onClick={() => setFirstMonth((month) => addMonths(month, 1))}
        disabled={firstMonth >= lastFirstMonth}
        aria-label="Next month"
      >
        <ChevronRight className="h-4 w-4" strokeWidth={2.5} />
      </button>
      <div className={cn("grid gap-x-12 gap-y-8", months === 2 && "md:grid-cols-2")}>
        {Array.from({ length: months }, (_, i) => renderMonth(addMonths(firstMonth, i)))}
      </div>
    </div>
  );
}
