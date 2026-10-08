"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import type { Quote } from "@/lib/types";

/** Asks the backend for the price breakdown + availability whenever dates or guests change. */
export function useQuote(listingId: number, checkIn: string | null, checkOut: string | null, guests: number) {
  const key = checkIn && checkOut ? `${listingId}|${checkIn}|${checkOut}|${guests}` : null;
  const [result, setResult] = useState<{ key: string; quote: Quote | null; error: string | null } | null>(null);

  useEffect(() => {
    if (!key || !checkIn || !checkOut) return;
    let cancelled = false;
    api
      .quote(listingId, checkIn, checkOut, Math.max(guests, 1))
      .then((quote) => !cancelled && setResult({ key, quote, error: null }))
      .catch((error: Error) => !cancelled && setResult({ key, quote: null, error: error.message }));
    return () => {
      cancelled = true;
    };
  }, [key, listingId, checkIn, checkOut, guests]);

  const current = result?.key === key ? result : null;
  return { quote: current?.quote ?? null, error: current?.error ?? null, loading: key !== null && current === null };
}
