"use client";

import { useRouter } from "next/navigation";
import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { api, getToken, setToken } from "@/lib/api";
import { AUTO_LOGIN_EMAIL } from "@/lib/constants";
import type { User } from "@/lib/types";
import { useToast } from "./ToastContext";

const AUTO_LOGIN_OFF_KEY = "airbnb_auto_login_off";

/** Auto-login is skipped once the user logged out in this browser (so "Log out" really logs out). */
function autoLoginAllowed(): boolean {
  try {
    return AUTO_LOGIN_EMAIL !== null && localStorage.getItem(AUTO_LOGIN_OFF_KEY) !== "1";
  } catch {
    return false;
  }
}

function rememberAutoLogin(enabled: boolean) {
  try {
    if (enabled) localStorage.removeItem(AUTO_LOGIN_OFF_KEY);
    else localStorage.setItem(AUTO_LOGIN_OFF_KEY, "1");
  } catch {
    // storage unavailable: nothing to remember
  }
}

interface AuthContextValue {
  user: User | null;
  loading: boolean; // true while we check a saved token on page load
  login: (email: string) => Promise<User>;
  signup: (email: string, name: string) => Promise<User>;
  logout: () => void;
  refreshUser: () => Promise<void>;
  isAuthModalOpen: boolean;
  openAuthModal: () => void;
  closeAuthModal: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

/** Holds the logged-in user. Auth is mocked: log in with just an email, the API returns a JWT. */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { showToast } = useToast();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAuthModalOpen, setAuthModalOpen] = useState(false);

  const refreshUser = useCallback(async () => {
    if (!getToken()) {
      setUser(null);
      return;
    }
    try {
      setUser(await api.me());
    } catch {
      setToken(null); // expired or invalid token
      setUser(null);
    }
  }, []);

  // On page load: use the saved token, or log in as the demo account (see AUTO_LOGIN_EMAIL).
  useEffect(() => {
    let cancelled = false;
    let loggedInAutomatically = false;

    async function autoLogin(): Promise<User | null> {
      if (!AUTO_LOGIN_EMAIL || !autoLoginAllowed()) return null;
      const response = await api.login(AUTO_LOGIN_EMAIL);
      setToken(response.token);
      loggedInAutomatically = true;
      return response.user;
    }

    const token = getToken();
    (token ? api.me().catch(() => (setToken(null), autoLogin())) : autoLogin())
      .then((me) => {
        if (cancelled) return;
        setUser(me);
        if (me && loggedInAutomatically) showToast(`Logged in as the demo guest, ${me.name.split(" ")[0]}`, { type: "success" });
      })
      .catch(() => setToken(null)) // backend unreachable: stay logged out
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [showToast]);

  const login = useCallback(async (email: string) => {
    const response = await api.login(email);
    setToken(response.token);
    rememberAutoLogin(true);
    setUser(response.user);
    return response.user;
  }, []);

  const signup = useCallback(async (email: string, name: string) => {
    const response = await api.signup(email, name);
    setToken(response.token);
    rememberAutoLogin(true);
    setUser(response.user);
    return response.user;
  }, []);

  const logout = useCallback(() => {
    rememberAutoLogin(false); // don't log straight back in on the next visit
    setToken(null);
    setUser(null);
    router.push("/");
  }, [router]);

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        signup,
        logout,
        refreshUser,
        isAuthModalOpen,
        openAuthModal: () => setAuthModalOpen(true),
        closeAuthModal: () => setAuthModalOpen(false),
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside <AuthProvider>");
  return context;
}
