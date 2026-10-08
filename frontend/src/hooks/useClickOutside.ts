import { useEffect, type RefObject } from "react";

/** Calls `onOutside` when the user clicks outside `ref` (used to close dropdowns and popovers). */
export function useClickOutside(ref: RefObject<HTMLElement | null>, onOutside: () => void, enabled = true) {
  useEffect(() => {
    if (!enabled) return;
    function handle(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) onOutside();
    }
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, [ref, onOutside, enabled]);
}
