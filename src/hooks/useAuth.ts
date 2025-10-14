"use client";

import { useState, useEffect, useCallback } from "react";
import { User } from "@/types/user"; // ✅ use shared type

interface AuthResult {
  success: boolean;
  user?: User;
  error?: string;
  token?: string;
}

export function useAuth() {
  const [user, setUser ] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const API_BASE = "/api/auth";

  // ✅ SSR-safe Token helpers (check for browser environment)
  const saveToken = useCallback((token: string) => {
    if (typeof window !== "undefined") {
      localStorage.setItem("token", token);
    }
  }, []);

  const getToken = useCallback((): string | null => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("token");
    }
    return null; // Safe default on server
  }, []);

  const removeToken = useCallback(() => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("token");
    }
  }, []);

  /** Register new user */
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
    } catch (err) {
      setError("Network error during registration");
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  /** Login user */
  /** Login user (UPDATED: Returns user on success, null on failure) */
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
        return null; // Return null on failure
      }
      saveToken(data.token); // Now SSR-safe
      setUser(data.user); // Set state
      return data.user; // UPDATED: Return user for immediate access in component
    } catch (err) {
      setError("Network error during login");
      return null; // Return null on error
    } finally {
      setLoading(false);
    }
  }, [saveToken]);
  

  /** Logout user */
  const logout = useCallback(async () => {
    try {
      await fetch(`${API_BASE}/logout`, { method: "POST" });
    } catch {
      // ignore API errors for stateless logout
    }
    removeToken(); // Now SSR-safe
    setUser (null);
  }, [removeToken]);

  /** Get current logged in user */
  const getCurrentUser  = useCallback(async () => {
    // Early return if on server (no localStorage)
    if (typeof window === "undefined") {
      setUser (null);
      setLoading(false);
      return;
    }

    const token = getToken(); // Now SSR-safe
    if (!token) {
      setUser (null);
      setLoading(false);
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data: AuthResult = await res.json();
      if (data.success && data.user) {
        setUser (data.user);
      } else {
        setUser (null);
        removeToken();
      }
    } catch {
      setUser (null);
      removeToken();
    } finally {
      setLoading(false);
    }
  }, [getToken, removeToken]);

  // Auto load user on mount (client-only due to useEffect)
  useEffect(() => {
    getCurrentUser ();
  }, [getCurrentUser ]);

  // ✅ Optional: Expose token and auth state (SSR-safe)
  const token = getToken();
  const isAuthenticated = !!user && !!token;

  return {
    user,
    loading,
    error,
    register,
    login,
    logout,
    getCurrentUser ,
    token, // ✅ Now safely exposed (null on server)
    isAuthenticated,
  };
}
