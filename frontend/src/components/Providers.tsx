"use client";

import { AuthProvider } from "@/context/AuthContext";
import { ToastProvider } from "@/context/ToastContext";
import { WishlistProvider } from "@/context/WishlistContext";
import AuthModal from "@/components/auth/AuthModal";

/** App-wide React context providers (toasts, logged-in user, wishlist) + the login modal. */
export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ToastProvider>
      <AuthProvider>
        <WishlistProvider>
          {children}
          <AuthModal />
        </WishlistProvider>
      </AuthProvider>
    </ToastProvider>
  );
}
