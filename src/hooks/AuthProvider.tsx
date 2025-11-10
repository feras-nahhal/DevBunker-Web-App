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
  profileImage: string | null; // NEW: Add profile image to context
  refreshProfileImage: () => Promise<void>; // NEW: Function to refresh profile image
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Cache in memory to avoid extra /me calls
let cachedUser: User | null = null;
let cachedToken: string | null = null;
let cachedProfileImage: string | null = null; // NEW: Cache for profile image

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(cachedUser);
  const [loading, setLoading] = useState<boolean>(!cachedUser);
  const [ready, setReady] = useState<boolean>(false);
  const [token, setToken] = useState<string | null>(
    typeof window !== "undefined" ? localStorage.getItem("token") : null
  );
  const [profileImage, setProfileImage] = useState<string | null>(cachedProfileImage); // NEW: State for profile image

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

  // NEW: Fetch profile image from /api/upload-profile (or /api/auth/me if it includes it)
  const fetchProfileImage = useCallback(async (t: string) => {
    try {
      const res = await fetch("/api/upload-profile", {
        headers: { Authorization: `Bearer ${t}` },
      });
      const data = await res.json();
      if (data.success && data.url) {
        setProfileImage(data.url);
        cachedProfileImage = data.url; // Cache it
        return data.url;
      }
      return null;
    } catch (err) {
      console.error("Failed to fetch profile image:", err);
      return null;
    }
  }, []);

  // NEW: Refresh function to re-fetch and update profile image
  const refreshProfileImage = useCallback(async () => {
    const t = cachedToken || token;
    if (!t) return; // No token, can't fetch
    const newImage = await fetchProfileImage(t);
    if (newImage) {
      setProfileImage(newImage);
      cachedProfileImage = newImage;
    }
  }, [token, fetchProfileImage]);

  // Get current user from /api/auth/me
  const getCurrentUser = useCallback(async () => {
    setLoading(true);
    try {
      if (cachedUser) {
        setUser(cachedUser);
        setProfileImage(cachedProfileImage); // NEW: Set cached image
        return cachedUser;
      }

      const t = cachedToken || token;
      if (!t) {
        setUser(null);
        setProfileImage(null); // NEW: Clear image
        return null;
      }

      const res = await fetch("/api/auth/me", {
        headers: { Authorization: `Bearer ${t}` },
      });
      const data = await res.json();
      if (data.success && data.user) {
        setUser(data.user);
        cachedUser = data.user;
        // NEW: Fetch and cache profile image after user is set
        await fetchProfileImage(t);
        return data.user;
      } else {
        setUser(null);
        cachedUser = null;
        setProfileImage(null); // NEW: Clear image
        removeToken();
        return null;
      }
    } catch {
      setUser(null);
      cachedUser = null;
      setProfileImage(null); // NEW: Clear image
      removeToken();
      return null;
    } finally {
      setLoading(false);
      setReady(true); // mark auth check complete
    }
  }, [token, removeToken, fetchProfileImage]);

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
        // NEW: Fetch and cache profile image on login
        await fetchProfileImage(data.token);
        setReady(true);
        return data.user;
      }
      return null;
    } finally {
      setLoading(false);
    }
  }, [saveToken, fetchProfileImage]);

  // Logout function
  const logout = useCallback(() => {
    removeToken();
    cachedUser = null;        // ✅ Clear cached user
    cachedProfileImage = null; // NEW: Clear cached image
    setUser(null);            // ✅ Clear state
    setProfileImage(null);    // NEW: Clear state
    setReady(false);          // ✅ Reset ready so components know auth is done
  }, [removeToken]);

  const isAuthenticated = !!user && !!token;

  return (
    <AuthContext.Provider
      value={{ user, loading, ready, login, logout, isAuthenticated, token, profileImage, refreshProfileImage }} // NEW: Add refreshProfileImage
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