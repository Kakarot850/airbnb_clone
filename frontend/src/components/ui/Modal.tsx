"use client";

import { X } from "lucide-react";
import { useEffect } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/cn";

const SIZES = {
  sm: "md:w-[420px]",
  md: "md:w-[568px]",
  lg: "md:w-[780px]",
  xl: "md:w-[1032px]",
};

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  size?: keyof typeof SIZES;
  headerAction?: React.ReactNode; // optional element on the right side of the header
  bodyClassName?: string;
}

/** Airbnb-style dialog: slides up from the bottom on mobile, centered card on desktop. */
export default function Modal({ open, onClose, title, children, footer, size = "md", headerAction, bodyClassName }: ModalProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => event.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden"; // stop the page behind from scrolling
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previousOverflow;
    };
  }, [open, onClose]);

  if (!open || typeof document === "undefined") return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex animate-fade-in items-end justify-center bg-black/50 md:items-center md:p-6"
      onMouseDown={(event) => event.target === event.currentTarget && onClose()}
    >
      <div
        role="dialog"
        aria-modal="true"
        className={cn(
          "flex max-h-[calc(100dvh-40px)] w-full animate-slide-up flex-col rounded-t-xl bg-canvas text-ink shadow-float md:max-h-[90vh] md:rounded-xl",
          SIZES[size],
        )}
      >
        <header className="relative flex h-16 shrink-0 items-center justify-center border-b border-divider px-16">
          <button onClick={onClose} className="absolute left-4 rounded-full p-2 hover:bg-soft" aria-label="Close">
            <X className="h-4 w-4" strokeWidth={2.5} />
          </button>
          {title && <h2 className="truncate text-base font-semibold">{title}</h2>}
          {headerAction && <div className="absolute right-4">{headerAction}</div>}
        </header>
        <div className={cn("flex-1 overflow-y-auto p-6", bodyClassName)}>{children}</div>
        {footer && <footer className="shrink-0 border-t border-divider px-6 py-4">{footer}</footer>}
      </div>
    </div>,
    document.body,
  );
}
