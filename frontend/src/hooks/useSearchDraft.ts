"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { parseSearch, searchUrl } from "@/lib/search";
import type { GuestCounts } from "@/lib/types";

/**
 * The values typed into the search bar (where / dates / who) before the user presses Search.
 * Starts from the current URL; `submit` navigates to the results while keeping category and filters.
 */
export function useSearchDraft() {
  const router = useRouter();
  const params = useSearchParams();
  const current = parseSearch(new URLSearchParams(params.toString()));

  const [location, setLocation] = useState(current.location);
  const [checkIn, setCheckIn] = useState<string | null>(current.checkIn);
  const [checkOut, setCheckOut] = useState<string | null>(current.checkOut);
  const [guests, setGuests] = useState<GuestCounts>({
    adults: current.adults,
    children: current.children,
    infants: current.infants,
    pets: current.pets,
  });

  function setDates(nextCheckIn: string | null, nextCheckOut: string | null) {
    setCheckIn(nextCheckIn);
    setCheckOut(nextCheckOut);
  }

  function clearAll() {
    setLocation("");
    setDates(null, null);
    setGuests({ adults: 0, children: 0, infants: 0, pets: 0 });
  }

  function submit() {
    router.push(searchUrl({ ...current, location, checkIn: checkOut ? checkIn : null, checkOut: checkIn ? checkOut : null, ...guests }));
    window.scrollTo({ top: 0 });
  }

  return { location, setLocation, checkIn, checkOut, setDates, guests, setGuests, clearAll, submit };
}
