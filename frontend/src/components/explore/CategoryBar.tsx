"use client";

import { ChevronLeft, ChevronRight, SlidersHorizontal } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { Skeleton } from "@/components/ui/Loading";
import { api } from "@/lib/api";
import { cn } from "@/lib/cn";
import { Icon } from "@/lib/icons";
import { countActiveFilters, parseSearch, searchUrl } from "@/lib/search";
import type { Category } from "@/lib/types";
import FiltersModal from "./FiltersModal";

/** The scrollable row of category icons (Beachfront, Cabins, ...) plus the Filters button. */
export default function CategoryBar() {
  const router = useRouter();
  const params = useSearchParams();
  const search = parseSearch(new URLSearchParams(params.toString()));
  const [categories, setCategories] = useState<Category[]>([]);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [arrows, setArrows] = useState({ left: false, right: false });
  const scroller = useRef<HTMLDivElement>(null);

  const updateArrows = useCallback(() => {
    const el = scroller.current;
    if (!el) return;
    setArrows({ left: el.scrollLeft > 4, right: el.scrollLeft + el.clientWidth < el.scrollWidth - 4 });
  }, []);

  useEffect(() => {
    api.categories().then((items) => {
      setCategories(items);
      requestAnimationFrame(updateArrows);
    }).catch(() => {});
    window.addEventListener("resize", updateArrows);
    return () => window.removeEventListener("resize", updateArrows);
  }, [updateArrows]);

  function selectCategory(slug: string) {
    // Clicking the selected category again shows everything.
    router.push(searchUrl({ ...search, category: search.category === slug ? null : slug }));
    window.scrollTo({ top: 0 });
  }

  const scrollBy = (direction: 1 | -1) => scroller.current?.scrollBy({ left: direction * scroller.current.clientWidth * 0.7, behavior: "smooth" });
  const arrow = "absolute top-1/2 z-10 hidden h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full border border-line bg-canvas shadow-sm transition hover:scale-105 hover:shadow-card md:flex";
  const activeFilters = countActiveFilters(search);

  return (
    <div className="page-container flex h-[78px] items-center gap-4 md:gap-6">
      <div className="relative min-w-0 flex-1">
        {arrows.left && (
          <>
            <div className="pointer-events-none absolute inset-y-0 left-0 z-[5] w-16 bg-gradient-to-r from-canvas via-canvas to-transparent" />
            <button onClick={() => scrollBy(-1)} className={cn(arrow, "left-0")} aria-label="Previous categories">
              <ChevronLeft className="h-4 w-4" strokeWidth={2.5} />
            </button>
          </>
        )}
        <div ref={scroller} onScroll={updateArrows} className="no-scrollbar flex gap-8 overflow-x-auto scroll-smooth">
          {categories.length === 0 &&
            Array.from({ length: 12 }, (_, i) => (
              <div key={i} className="flex shrink-0 flex-col items-center gap-2 pb-3 pt-1">
                <Skeleton className="h-6 w-6 rounded-full" />
                <Skeleton className="h-3 w-14" />
              </div>
            ))}
          {categories.map((category) => {
            const active = search.category === category.slug;
            return (
              <button
                key={category.slug}
                onClick={() => selectCategory(category.slug)}
                aria-pressed={active}
                className={cn(
                  "flex shrink-0 flex-col items-center gap-2 border-b-2 pb-2.5 pt-1 text-xs font-semibold transition-colors",
                  active ? "border-ink text-ink" : "border-transparent text-muted hover:border-line hover:text-ink",
                )}
              >
                <Icon name={category.icon} className="h-6 w-6" strokeWidth={active ? 1.8 : 1.5} />
                <span className="whitespace-nowrap">{category.name}</span>
              </button>
            );
          })}
        </div>
        {arrows.right && (
          <>
            <div className="pointer-events-none absolute inset-y-0 right-0 z-[5] w-16 bg-gradient-to-l from-canvas via-canvas to-transparent" />
            <button onClick={() => scrollBy(1)} className={cn(arrow, "right-0")} aria-label="More categories">
              <ChevronRight className="h-4 w-4" strokeWidth={2.5} />
            </button>
          </>
        )}
      </div>

      <button
        onClick={() => setFiltersOpen(true)}
        className={cn(
          "relative flex h-12 shrink-0 items-center gap-2 rounded-xl border px-3.5 text-xs font-semibold transition hover:border-ink hover:bg-soft md:px-4",
          activeFilters ? "border-ink" : "border-line",
        )}
      >
        <SlidersHorizontal className="h-4 w-4" />
        <span className="hidden md:inline">Filters</span>
        {activeFilters > 0 && (
          <span className="absolute -right-2 -top-2 flex h-5 min-w-5 items-center justify-center rounded-full bg-ink px-1 text-[10px] font-bold text-canvas">
            {activeFilters}
          </span>
        )}
      </button>
      {filtersOpen && <FiltersModal onClose={() => setFiltersOpen(false)} />}
    </div>
  );
}
