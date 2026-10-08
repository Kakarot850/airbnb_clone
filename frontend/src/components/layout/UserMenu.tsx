"use client";

import { Menu } from "lucide-react";
import Link from "next/link";
import { useRef, useState } from "react";
import Avatar from "@/components/ui/Avatar";
import { useAuth } from "@/context/AuthContext";
import { useClickOutside } from "@/hooks/useClickOutside";
import { getTheme, setTheme, type Theme } from "@/lib/theme";

/** The "☰ + avatar" button in the top right corner and its dropdown menu. */
export default function UserMenu() {
  const { user, logout, openAuthModal } = useAuth();
  const [open, setOpen] = useState(false);
  const [theme, setThemeState] = useState<Theme>("light");
  const ref = useRef<HTMLDivElement>(null);
  useClickOutside(ref, () => setOpen(false), open);

  const item = "block w-full px-4 py-3 text-left text-sm hover:bg-soft";
  const close = () => setOpen(false);

  function toggleTheme() {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    setThemeState(next);
  }

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => {
          setThemeState(getTheme()); // read the real theme when opening (it lives on <html>)
          setOpen((value) => !value);
        }}
        aria-label="Main navigation menu"
        aria-expanded={open}
        className="flex items-center gap-3 rounded-full border border-line bg-canvas py-1.5 pl-3.5 pr-1.5 transition hover:shadow-card"
      >
        <Menu className="h-4 w-4" strokeWidth={2.5} />
        <Avatar src={user?.avatar_url} name={user?.name} className="h-[30px] w-[30px] text-xs" />
      </button>

      {open && (
        <div className="absolute right-0 top-[calc(100%+8px)] z-50 w-64 overflow-hidden rounded-xl bg-canvas py-2 shadow-float">
          {user ? (
            <>
              <Link href="/messages" className={`${item} font-semibold`} onClick={close}>Messages</Link>
              <Link href="/notifications" className={`${item} font-semibold`} onClick={close}>Notifications</Link>
              <Link href="/trips" className={`${item} font-semibold`} onClick={close}>Trips</Link>
              <Link href="/wishlists" className={`${item} font-semibold`} onClick={close}>Wishlists</Link>
              <hr className="my-2 border-divider" />
              {user.is_host ? (
                <Link href="/host" className={item} onClick={close}>Manage listings</Link>
              ) : (
                <Link href="/host/listings/new" className={item} onClick={close}>Airbnb your home</Link>
              )}
              <Link href="/account" className={item} onClick={close}>Account</Link>
            </>
          ) : (
            <>
              <button className={`${item} font-semibold`} onClick={() => { close(); openAuthModal(); }}>Log in</button>
              <button className={item} onClick={() => { close(); openAuthModal(); }}>Sign up</button>
              <hr className="my-2 border-divider" />
              <Link href="/host/listings/new" className={item} onClick={close}>Airbnb your home</Link>
            </>
          )}
          <button className={`${item} flex items-center justify-between`} onClick={toggleTheme} role="switch" aria-checked={theme === "dark"}>
            Dark mode
            <span className={`relative h-6 w-10 rounded-full transition ${theme === "dark" ? "bg-ink" : "bg-line"}`}>
              <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-canvas shadow transition-all ${theme === "dark" ? "left-[18px]" : "left-0.5"}`} />
            </span>
          </button>
          <Link href="/help" className={item} onClick={close}>Help Center</Link>
          {user && (
            <>
              <hr className="my-2 border-divider" />
              <button className={item} onClick={() => { close(); logout(); }}>Log out</button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
