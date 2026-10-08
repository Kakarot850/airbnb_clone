"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BeloIcon } from "@/components/layout/Logo";
import UserMenu from "@/components/layout/UserMenu";
import { useToast } from "@/context/ToastContext";
import { cn } from "@/lib/cn";

/** Header of the hosting area: Today / Listings / Calendar / Messages + "Switch to traveling". */
export default function HostHeader() {
  const pathname = usePathname();
  const { showToast } = useToast();
  const link = (active: boolean) =>
    cn(
      "relative whitespace-nowrap rounded-full px-4 py-2.5 text-sm font-semibold transition hover:bg-soft",
      active ? "text-ink after:absolute after:inset-x-4 after:bottom-0.5 after:h-0.5 after:bg-ink" : "text-muted hover:text-ink",
    );

  const nav = (
    <>
      <Link href="/host" className={link(pathname === "/host")}>Today</Link>
      <Link href="/host/listings" className={link(pathname.startsWith("/host/listings"))}>Listings</Link>
      <button onClick={() => showToast("The hosting calendar is coming soon.")} className={link(false)}>Calendar</button>
      <Link href="/messages" className={link(false)}>Messages</Link>
    </>
  );

  return (
    <header className="sticky top-0 z-50 border-b border-divider bg-canvas">
      <div className="page-container flex h-20 items-center justify-between gap-4">
        <Link href="/host" className="text-ink" aria-label="Hosting home">
          <BeloIcon className="h-8 w-8" />
        </Link>
        <nav className="hidden items-center gap-1 md:flex">{nav}</nav>
        <div className="flex items-center gap-2">
          <Link href="/" className="rounded-full px-4 py-3 text-sm font-semibold hover:bg-soft">
            Switch to traveling
          </Link>
          <UserMenu />
        </div>
      </div>
      <nav className="no-scrollbar page-container flex gap-1 overflow-x-auto pb-2 md:hidden">{nav}</nav>
    </header>
  );
}
