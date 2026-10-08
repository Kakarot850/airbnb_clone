"use client";

import { CircleUser, Heart, MessageSquare, Search } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { cn } from "@/lib/cn";
import { BeloIcon } from "./Logo";

/** Bottom tab bar on phones (Explore, Wishlists, Trips, Inbox, Profile). */
export default function MobileNav() {
  const pathname = usePathname();
  const { user, openAuthModal } = useAuth();
  // Listing and checkout pages have their own sticky bottom bar instead.
  if (pathname.startsWith("/rooms/") || pathname.startsWith("/book/")) return null;

  const tab = (active: boolean) =>
    cn("flex flex-1 flex-col items-center gap-1 pt-2 text-[10px] font-semibold", active ? "text-brand" : "text-muted");

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 flex h-16 border-t border-divider bg-canvas md:hidden">
      <Link href="/" className={tab(pathname === "/")}>
        <Search className="h-6 w-6" strokeWidth={pathname === "/" ? 2.5 : 1.8} /> Explore
      </Link>
      <Link href="/wishlists" className={tab(pathname === "/wishlists")}>
        <Heart className="h-6 w-6" strokeWidth={1.8} /> Wishlists
      </Link>
      {user && (
        <Link href="/trips" className={tab(pathname.startsWith("/trips"))}>
          <BeloIcon className="h-6 w-6" /> Trips
        </Link>
      )}
      {user && (
        <Link href="/messages" className={tab(pathname === "/messages")}>
          <MessageSquare className="h-6 w-6" strokeWidth={1.8} /> Inbox
        </Link>
      )}
      {user ? (
        <Link href="/account" className={tab(pathname === "/account")}>
          <CircleUser className="h-6 w-6" strokeWidth={1.8} /> Profile
        </Link>
      ) : (
        <button onClick={openAuthModal} className={tab(false)}>
          <CircleUser className="h-6 w-6" strokeWidth={1.8} /> Log in
        </button>
      )}
    </nav>
  );
}
