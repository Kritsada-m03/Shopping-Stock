"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { api } from "@/lib/api";
import type { MockLoginInput, MockUser } from "@/lib/types";

const STORAGE_KEY = "shopping.mock-user.v1";

function readProfile(value: string | null): MockUser | null {
  if (!value) return null;
  try {
    const profile = JSON.parse(value);
    return typeof profile?.id === "string" && typeof profile.displayName === "string"
      && (profile.role === "Admin" || profile.role === "User")
      && (profile.phone === null || typeof profile.phone === "string") ? profile : null;
  } catch { return null; }
}

interface MockLoginContextValue {
  user: MockUser | null;
  ready: boolean;
  login: (input: MockLoginInput) => Promise<MockUser>;
  logout: () => void;
}

const MockLoginContext = createContext<MockLoginContextValue | null>(null);

export function MockLoginProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<MockUser | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try { setUser(readProfile(localStorage.getItem(STORAGE_KEY))); } catch { /* session only */ }
    setReady(true);
    const sync = (event: StorageEvent) => {
      if (event.key === STORAGE_KEY || event.key === null) setUser(readProfile(event.newValue));
    };
    window.addEventListener("storage", sync);
    return () => window.removeEventListener("storage", sync);
  }, []);

  async function login(input: MockLoginInput) {
    const profile = await api.login(input);
    // Keep only the demo profile. Never store the entered password.
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(profile)); } catch { /* session only */ }
    setUser(profile);
    return profile;
  }

  function logout() {
    try { localStorage.removeItem(STORAGE_KEY); } catch { /* session only */ }
    setUser(null);
  }

  return <MockLoginContext.Provider value={{ user, ready, login, logout }}>{children}</MockLoginContext.Provider>;
}

export function useMockLogin() {
  const context = useContext(MockLoginContext);
  if (!context) throw new Error("useMockLogin must be used inside MockLoginProvider");
  return context;
}
