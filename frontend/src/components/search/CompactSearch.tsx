"use client";

import { Search } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { formatDateRange, plural } from "@/lib/format";
import { parseSearch } from "@/lib/search";
import type { SearchSection } from "./SearchBar";

/** The small "Anywhere | Any week | Add guests" pill. Clicking a part opens the full search bar there. */
export default function CompactSearch({ onOpen }: { onOpen: (section: SearchSection) => void }) {
  const search = parseSearch(new URLSearchParams(useSearchParams().toString()));
  const guests = search.adults + search.children;
  const part = "truncate px-4 text-sm font-semibold";

  return (
    <div className="flex h-12 items-center rounded-full border border-line bg-canvas pl-2 pr-2 shadow-pill transition hover:shadow-card">
      <button type="button" onClick={() => onOpen("where")} className={`${part} max-w-40`}>
        {search.location || "Anywhere"}
      </button>
      <span className="h-6 w-px bg-line" />
      <button type="button" onClick={() => onOpen("checkIn")} className={part}>
        {search.checkIn && search.checkOut ? formatDateRange(search.checkIn, search.checkOut) : "Any week"}
      </button>
      <span className="h-6 w-px bg-line" />
      <button type="button" onClick={() => onOpen("who")} className={`${part} ${guests ? "" : "font-normal text-muted"}`}>
        {guests ? plural(guests, "guest") : "Add guests"}
      </button>
      <button type="button" onClick={() => onOpen("where")} aria-label="Search" className="flex h-8 w-8 items-center justify-center rounded-full bg-brand text-white">
        <Search className="h-3.5 w-3.5" strokeWidth={3} />
      </button>
    </div>
  );
}
