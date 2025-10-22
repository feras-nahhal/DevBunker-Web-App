"use client";

import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from "react";
import { User } from "@/types/user";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  ready: boolean; // NEW: indicates auth check finished
  login: (email: string, password: string) => Promise<User | null>;
  logout: () => void;
  isAuthenticated: boolean;
  token: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Cache in memory to avoid extra /me calls
let cachedUser: User | null = null;
let cachedToken: string | null = null;

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(cachedUser);
  const [loading, setLoading] = useState<boolean>(!cachedUser);
  const [ready, setReady] = useState<boolean>(false);
  const [token, setToken] = useState<string | null>(
    typeof window !== "undefined" ? localStorage.getItem("token") : null
  );

  // Save token in localStorage + memory cache
  const saveToken = useCallback((t: string) => {
    if (typeof window !== "undefined") localStorage.setItem("token", t);
    cachedToken = t;
    setToken(t);
  }, []);

  // Remove token
  const removeToken = useCallback(() => {
    if (typeof window !== "undefined") localStorage.removeItem("token");
    cachedToken = null;
    setToken(null);
  }, []);

  // Get current user from /api/auth/me
  const getCurrentUser = useCallback(async () => {
    setLoading(true);
    try {
      if (cachedUser) {
        setUser(cachedUser);
        return cachedUser;
      }

      const t = cachedToken || token;
      if (!t) {
        setUser(null);
        return null;
      }

      const res = await fetch("/api/auth/me", {
        headers: { Authorization: `Bearer ${t}` },
      });
      const data = await res.json();
      if (data.success && data.user) {
        setUser(data.user);
        cachedUser = data.user;
        return data.user;
      } else {
        setUser(null);
        cachedUser = null;
        removeToken();
        return null;
      }
    } catch {
      setUser(null);
      cachedUser = null;
      removeToken();
      return null;
    } finally {
      setLoading(false);
      setReady(true); // mark auth check complete
    }
  }, [token, removeToken]);

  useEffect(() => {
    getCurrentUser();
  }, [getCurrentUser]);

  // Login function
  const login = useCallback(async (email: string, password: string) => {
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (data.success && data.user && data.token) {
        saveToken(data.token);
        setUser(data.user);
        cachedUser = data.user;
        setReady(true);
        return data.user;
      }
      return null;
    } finally {
      setLoading(false);
    }
  }, [saveToken]);

  // Logout function
  // AuthContext.tsx
const logout = useCallback(() => {
  removeToken();
  cachedUser = null;        // ✅ Clear cached user
  setUser(null);            // ✅ Clear state
  setReady(false);          // ✅ Reset ready so components know auth is done
}, [removeToken]);


  const isAuthenticated = !!user && !!token;

  return (
    <AuthContext.Provider
      value={{ user, loading, ready, login, logout, isAuthenticated, token }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuthContext = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuthContext must be used within an AuthProvider");
  return context;
};
