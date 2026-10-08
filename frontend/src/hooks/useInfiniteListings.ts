"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { api, type Query } from "@/lib/api";
import type { ListingCard } from "@/lib/types";

const PAGE_SIZE = 20;

interface Results {
  key: string; // which search these results belong to
  items: ListingCard[];
  page: number;
  total: number;
  totalPages: number;
  error: string | null;
}

/**
 * Loads search results page by page (infinite scroll).
 * Whenever the query changes we start again from page 1; stale responses are ignored.
 */
export function useInfiniteListings(query: Query) {
  const key = JSON.stringify(query);
  const [results, setResults] = useState<Results | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const latestKey = useRef(key);

  useEffect(() => {
    latestKey.current = key;
    let cancelled = false;
    api
      .searchListings({ ...JSON.parse(key), page: 1, page_size: PAGE_SIZE })
      .then((page) => {
        if (!cancelled) setResults({ key, items: page.items, page: 1, total: page.total, totalPages: page.total_pages, error: null });
      })
      .catch((error: Error) => {
        if (!cancelled) setResults({ key, items: [], page: 1, total: 0, totalPages: 0, error: error.message });
      });
    return () => {
      cancelled = true;
    };
  }, [key]);

  const current = results?.key === key ? results : null; // null while the first page is loading
  const hasMore = current !== null && current.page < current.totalPages;

  const loadMore = useCallback(() => {
    if (!current || !hasMore || loadingMore) return;
    const requestKey = key;
    setLoadingMore(true);
    api
      .searchListings({ ...JSON.parse(key), page: current.page + 1, page_size: PAGE_SIZE })
      .then((page) => {
        if (latestKey.current !== requestKey) return; // the search changed meanwhile
        setResults((previous) =>
          previous && previous.key === requestKey
            ? { ...previous, items: [...previous.items, ...page.items], page: page.page }
            : previous,
        );
      })
      .catch(() => {})
      .finally(() => setLoadingMore(false));
  }, [current, hasMore, loadingMore, key]);

  return {
    listings: current?.items ?? [],
    total: current?.total ?? 0,
    error: current?.error ?? null,
    loading: current === null,
    loadingMore,
    hasMore,
    loadMore,
  };
}
