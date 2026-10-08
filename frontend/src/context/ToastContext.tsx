"use client";

import { CircleAlert, CircleCheck, X } from "lucide-react";
import Link from "next/link";
import { createContext, useCallback, useContext, useState } from "react";

type ToastType = "success" | "error" | "info";

interface ToastOptions {
  type?: ToastType;
  image?: string; // small thumbnail, e.g. the listing saved to a wishlist
  action?: { label: string; href: string };
}

interface Toast extends ToastOptions {
  id: number;
  message: string;
}

const ToastContext = createContext<{ showToast: (message: string, options?: ToastOptions) => void } | null>(null);

const TOAST_DURATION_MS = 4000;
let nextId = 1;

/** Airbnb-style notifications that pop up in the bottom-left corner. */
export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const dismiss = useCallback((id: number) => setToasts((all) => all.filter((toast) => toast.id !== id)), []);

  const showToast = useCallback(
    (message: string, options: ToastOptions = {}) => {
      const id = nextId++;
      setToasts((all) => [...all.slice(-2), { id, message, type: "info", ...options }]);
      setTimeout(() => dismiss(id), TOAST_DURATION_MS);
    },
    [dismiss],
  );

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="pointer-events-none fixed bottom-20 left-4 right-4 z-[200] flex flex-col gap-3 md:bottom-6 md:left-6 md:right-auto">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            role="status"
            className="pointer-events-auto flex w-full animate-toast-in items-center gap-3 rounded-xl bg-canvas p-3 pr-4 shadow-float md:w-[380px]"
          >
            {toast.image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={toast.image} alt="" className="h-12 w-12 shrink-0 rounded-lg object-cover" />
            ) : toast.type === "error" ? (
              <CircleAlert className="ml-1 h-6 w-6 shrink-0 text-error" />
            ) : (
              <CircleCheck className="ml-1 h-6 w-6 shrink-0 text-success" />
            )}
            <p className="flex-1 text-sm font-semibold text-ink">{toast.message}</p>
            {toast.action && (
              <Link href={toast.action.href} className="text-sm font-semibold underline" onClick={() => dismiss(toast.id)}>
                {toast.action.label}
              </Link>
            )}
            <button onClick={() => dismiss(toast.id)} className="rounded-full p-1 hover:bg-soft" aria-label="Dismiss">
              <X className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) throw new Error("useToast must be used inside <ToastProvider>");
  return context;
}
