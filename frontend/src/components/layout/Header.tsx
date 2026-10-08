"use client";

import { Globe, Search } from "lucide-react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import CategoryBar from "@/components/explore/CategoryBar";
import CompactSearch from "@/components/search/CompactSearch";
import MobileSearch from "@/components/search/MobileSearch";
import SearchBar, { type SearchSection } from "@/components/search/SearchBar";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import { cn } from "@/lib/cn";
import { formatDateRange, plural } from "@/lib/format";
import { parseSearch } from "@/lib/search";
import Logo from "./Logo";
import UserMenu from "./UserMenu";

/**
 * Top navigation. On the home page it is fixed, shows the big search bar while at the top of the
 * page and collapses into the small search pill once the user scrolls (like Airbnb).
 */
export default function Header() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const { showToast } = useToast();
  const isHome = pathname === "/";
  const isListingPage = pathname.startsWith("/rooms/");
  const isCheckout = pathname.startsWith("/book/");

  const [scrolled, setScrolled] = useState(false);
  const [expanded, setExpanded] = useState(false); // big search opened from the small pill
  const [active, setActive] = useState<SearchSection | null>(null);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 4);
      setExpanded(false); // scrolling closes an opened search, like on Airbnb
      setActive(null);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const showBigSearch = (isHome && !scrolled) || expanded;
  const closeSearch = () => {
    setExpanded(false);
    setActive(null);
  };
  const search = parseSearch(new URLSearchParams(searchParams.toString()));
  const guests = search.adults + search.children;

  // Checkout shows a minimal header with just the logo, like Airbnb.
  if (isCheckout) {
    return (
      <header className="border-b border-divider bg-canvas">
        <div className="mx-auto flex h-20 max-w-[1120px] items-center px-6 md:px-10">
          <Logo alwaysShowText />
        </div>
      </header>
    );
  }

  return (
    <>
      <header className={cn("inset-x-0 top-0 z-50 bg-canvas", isHome ? "fixed" : "sticky", (!isHome || scrolled) && "border-b border-divider")}>
        <div className={cn(isListingPage ? "detail-container" : "page-container", "relative")}>
          {/* Desktop: logo | tabs or compact search | host link + menu */}
          <div className="hidden h-20 items-center justify-between gap-4 md:flex">
            <div className="flex flex-1 items-center">
              <Logo />
            </div>
            {showBigSearch ? (
              <nav className="flex items-center gap-2 text-base">
                <span className="relative px-4 py-2 font-semibold after:absolute after:inset-x-4 after:-bottom-1 after:h-0.5 after:rounded-full after:bg-ink">Stays</span>
                <Link href="/experiences" className="rounded-full px-4 py-2 text-muted hover:bg-soft hover:text-ink">Experiences</Link>
              </nav>
            ) : (
              <CompactSearch
                onOpen={(section) => {
                  setExpanded(true);
                  setActive(section);
                }}
              />
            )}
            <div className="flex flex-1 items-center justify-end gap-1">
              <Link href={user?.is_host ? "/host" : "/host/listings/new"} className="hidden rounded-full px-4 py-3 text-sm font-semibold hover:bg-soft lg:block">
                {user?.is_host ? "Switch to hosting" : "Airbnb your home"}
              </Link>
              <button onClick={() => showToast("Languages and currencies are coming soon.")} className="mr-2 rounded-full p-3 hover:bg-soft" aria-label="Choose a language and currency">
                <Globe className="h-4 w-4" />
              </button>
              <UserMenu />
            </div>
          </div>

          {/* Phones: one search pill that opens the full-screen search */}
          <div className="flex h-[72px] items-center md:hidden">
            <button
              onClick={() => setMobileSearchOpen(true)}
              className="flex w-full items-center gap-4 rounded-full border border-line bg-canvas px-5 py-2.5 text-left shadow-[0_3px_10px_rgba(0,0,0,0.1)]"
            >
              <Search className="h-5 w-5 shrink-0" strokeWidth={2.5} />
              <span className="min-w-0">
                <span className="block truncate text-sm font-semibold">{search.location || "Where to?"}</span>
                <span className="block truncate text-xs text-muted">
                  {search.checkIn && search.checkOut ? formatDateRange(search.checkIn, search.checkOut) : "Any week"} ·{" "}
                  {guests ? plural(guests, "guest") : "Add guests"}
                </span>
              </span>
            </button>
          </div>

          {/* Big search bar (desktop) */}
          {showBigSearch && (
            <div className={cn("hidden md:block", isHome ? "h-[88px] pt-1" : "absolute inset-x-0 top-full border-b border-divider bg-canvas px-10 pb-6 pt-1")}>
              <SearchBar key={searchParams.toString()} active={active} onActiveChange={setActive} onSubmitted={closeSearch} />
            </div>
          )}
        </div>
        {isHome && <CategoryBar />}
      </header>

      {/* The home header is fixed, so this keeps page content from hiding underneath it. */}
      {isHome && <div className="h-[150px] md:h-[246px]" />}
      {expanded && <div className="fixed inset-0 z-40 bg-black/25" onClick={closeSearch} />}
      {mobileSearchOpen && <MobileSearch key={searchParams.toString()} onClose={() => setMobileSearchOpen(false)} />}
    </>
  );
}
