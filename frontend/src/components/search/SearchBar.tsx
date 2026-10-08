"use client";

import { format, parseISO } from "date-fns";
import { Search, X } from "lucide-react";
import { useRef } from "react";
import DateRangePicker from "@/components/ui/DateRangePicker";
import GuestPicker from "@/components/ui/GuestPicker";
import { useClickOutside } from "@/hooks/useClickOutside";
import { useSearchDraft } from "@/hooks/useSearchDraft";
import { cn } from "@/lib/cn";
import { guestsSummary } from "@/lib/format";
import LocationSuggestions from "./LocationSuggestions";

export type SearchSection = "where" | "checkIn" | "checkOut" | "who";

interface SearchBarProps {
  active: SearchSection | null; // which part of the bar is open
  onActiveChange: (section: SearchSection | null) => void;
  onSubmitted?: () => void;
}

/** The big desktop search bar: Where | Check in | Check out | Who, each opening its own panel. */
export default function SearchBar({ active, onActiveChange, onSubmitted }: SearchBarProps) {
  const draft = useSearchDraft();
  const wrapper = useRef<HTMLDivElement>(null);
  const input = useRef<HTMLInputElement>(null);
  useClickOutside(wrapper, () => onActiveChange(null), active !== null);

  const guestCount = draft.guests.adults + draft.guests.children;

  function submit() {
    draft.submit();
    onActiveChange(null);
    onSubmitted?.();
  }

  function segment(section: SearchSection, label: string, content: React.ReactNode, onClear: (() => void) | null, className = "") {
    const isActive = active === section;
    return (
      <div
        role="button"
        tabIndex={0}
        onClick={() => {
          onActiveChange(section);
          if (section === "where") input.current?.focus();
        }}
        onKeyDown={(event) => event.key === "Enter" && onActiveChange(section)}
        className={cn(
          "relative flex h-full min-w-0 cursor-pointer items-center rounded-full pl-8 pr-4 transition-colors",
          isActive ? "bg-canvas shadow-active" : active ? "hover:bg-line/60" : "hover:bg-divider",
          className,
        )}
      >
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold">{label}</p>
          {content}
        </div>
        {isActive && onClear && (
          <button
            type="button"
            aria-label={`Clear ${label}`}
            onClick={(event) => {
              event.stopPropagation();
              onClear();
            }}
            className="ml-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full hover:bg-divider"
          >
            <X className="h-3.5 w-3.5" strokeWidth={2.5} />
          </button>
        )}
      </div>
    );
  }

  const valueClass = (filled: boolean) => cn("truncate text-sm", filled ? "font-semibold text-ink" : "text-muted");
  const divider = (left: SearchSection, right: SearchSection) => (
    <span className={cn("h-8 w-px shrink-0 bg-line", (active === left || active === right) && "opacity-0")} />
  );

  return (
    <div ref={wrapper} className="relative mx-auto w-full max-w-[850px]">
      <div className={cn("flex h-[66px] items-center rounded-full border border-line", active ? "bg-divider" : "bg-canvas shadow-active")}>
        {segment(
          "where",
          "Where",
          <input
            ref={input}
            value={draft.location}
            onChange={(event) => {
              draft.setLocation(event.target.value);
              onActiveChange("where");
            }}
            onKeyDown={(event) => event.key === "Enter" && submit()}
            placeholder="Search destinations"
            className="w-full truncate bg-transparent text-sm font-semibold text-ink outline-none placeholder:font-normal placeholder:text-muted"
          />,
          draft.location ? () => draft.setLocation("") : null,
          "flex-[1.3]",
        )}
        {divider("where", "checkIn")}
        {segment(
          "checkIn",
          "Check in",
          <p className={valueClass(Boolean(draft.checkIn))}>{draft.checkIn ? format(parseISO(draft.checkIn), "MMM d") : "Add dates"}</p>,
          draft.checkIn ? () => draft.setDates(null, null) : null,
          "flex-1",
        )}
        {divider("checkIn", "checkOut")}
        {segment(
          "checkOut",
          "Check out",
          <p className={valueClass(Boolean(draft.checkOut))}>{draft.checkOut ? format(parseISO(draft.checkOut), "MMM d") : "Add dates"}</p>,
          draft.checkOut ? () => draft.setDates(draft.checkIn, null) : null,
          "flex-1",
        )}
        {divider("checkOut", "who")}
        {segment(
          "who",
          "Who",
          <p className={valueClass(guestCount > 0)}>{guestCount > 0 ? guestsSummary(draft.guests) : "Add guests"}</p>,
          guestCount > 0 ? () => draft.setGuests({ adults: 0, children: 0, infants: 0, pets: 0 }) : null,
          "flex-[1.3] pr-2",
        )}
        <button
          type="button"
          onClick={submit}
          aria-label="Search"
          className={cn(
            "absolute right-2 flex h-12 items-center justify-center gap-2 rounded-full bg-brand-gradient font-semibold text-white transition-all",
            active ? "px-4" : "w-12",
          )}
        >
          <Search className="h-4 w-4" strokeWidth={3} />
          {active && <span className="pr-1 text-base">Search</span>}
        </button>
      </div>

      {active === "where" && (
        <div className="absolute left-0 top-[calc(100%+12px)] z-50 max-h-[70vh] w-[425px] overflow-y-auto rounded-[32px] bg-canvas p-5 shadow-float">
          <LocationSuggestions
            query={draft.location}
            onSelect={(place) => {
              draft.setLocation(place);
              onActiveChange("checkIn");
            }}
          />
        </div>
      )}
      {(active === "checkIn" || active === "checkOut") && (
        <div className="absolute inset-x-0 top-[calc(100%+12px)] z-50 rounded-[32px] bg-canvas px-8 pb-6 pt-8 shadow-float">
          <DateRangePicker
            checkIn={draft.checkIn}
            checkOut={draft.checkOut}
            onChange={(start, end) => {
              draft.setDates(start, end);
              onActiveChange(start ? "checkOut" : "checkIn");
            }}
          />
          <div className="mt-4 flex justify-end">
            <button type="button" className="rounded-lg px-3 py-2 text-sm font-semibold underline hover:bg-soft" onClick={() => draft.setDates(null, null)}>
              Clear dates
            </button>
          </div>
        </div>
      )}
      {active === "who" && (
        <div className="absolute right-0 top-[calc(100%+12px)] z-50 w-[420px] rounded-[32px] bg-canvas px-8 py-4 shadow-float">
          <GuestPicker value={draft.guests} onChange={draft.setGuests} />
        </div>
      )}
    </div>
  );
}
