"use client";

import { useState, useEffect, useCallback } from "react";
import { User } from "@/types/user";

interface AuthResult {
  success: boolean;
  user?: User;
  error?: string;
  token?: string;
}

// Module-level cache to prevent multiple /me calls
let cachedUser: User | null = null;
let cachedToken: string | null = null;

export function useAuth() {
  const [user, setUser] = useState<User | null>(cachedUser);
  const [loading, setLoading] = useState<boolean>(!cachedUser);
  const [error, setError] = useState<string | null>(null);

  const API_BASE = "/api/auth";

  const saveToken = useCallback((token: string) => {
    if (typeof window !== "undefined") {
      localStorage.setItem("token", token);
      cachedToken = token; // cache token in memory
    }
  }, []);

  const getToken = useCallback((): string | null => {
    if (cachedToken) return cachedToken;
    if (typeof window !== "undefined") {
      const t = localStorage.getItem("token");
      cachedToken = t;
      return t;
    }
    return null;
  }, []);

  const removeToken = useCallback(() => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("token");
    }
    cachedToken = null;
  }, []);

  const register = useCallback(async (email: string, password: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data: AuthResult = await res.json();
      if (!data.success) {
        setError(data.error || "Registration failed");
        return false;
      }
      return true;
    } catch {
      setError("Network error during registration");
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data: AuthResult = await res.json();
      if (!data.success || !data.token || !data.user) {
        setError(data.error || "Login failed");
        return null;
      }
      saveToken(data.token);
      setUser(data.user);
      cachedUser = data.user; // cache user in memory
      return data.user;
    } catch {
      setError("Network error during login");
      return null;
    } finally {
      setLoading(false);
    }
  }, [saveToken]);

  const logout = useCallback(async () => {
    try {
      await fetch(`${API_BASE}/logout`, { method: "POST" });
    } catch {}
    removeToken();
    setUser(null);
    cachedUser = null; // clear cache
  }, [removeToken]);

  const getCurrentUser = useCallback(async () => {
    if (cachedUser) {
      setUser(cachedUser);
      setLoading(false);
      return cachedUser;
    }

    const token = getToken();
    if (!token) {
      setUser(null);
      setLoading(false);
      return null;
    }

    try {
      const res = await fetch(`${API_BASE}/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data: AuthResult = await res.json();
      if (data.success && data.user) {
        setUser(data.user);
        cachedUser = data.user; // cache
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
    }
  }, [getToken, removeToken]);

  useEffect(() => {
    getCurrentUser();
  }, [getCurrentUser]);

  const token = getToken();
  const isAuthenticated = !!user && !!token;

  return {
    user,
    loading,
    error,
    register,
    login,
    logout,
    getCurrentUser,
    token,
    isAuthenticated,
  };
}
