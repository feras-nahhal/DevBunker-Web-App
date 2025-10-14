"use client";

import { useState, useEffect, useCallback } from "react";
import { usePathname } from "next/navigation";
import { Bookmark, ReadLater } from "@/types/content";

interface UseSavedContentOptions {
  autoFetch?: boolean;
}

/**
 * Custom hook to manage Bookmarks & Read Later content.
 * - Prevents unnecessary API calls when not on relevant pages.
 * - Only fetches once per session (unless manually refetched).
 */
export function useBookmarksAndReadLater({
  autoFetch = true,
}: UseSavedContentOptions = {}) {
  const pathname = usePathname();

  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [readLater, setReadLater] = useState<ReadLater[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [initialized, setInitialized] = useState(false);

  const token =
    typeof window !== "undefined"
      ? localStorage.getItem("token") || undefined
      : undefined;

  // Only fetch when user is on /bookmarks or /read-later pages
  const shouldFetch =
    pathname.includes("bookmarks") || pathname.includes("read-later");

  /** -----------------------------
   * 🟢 Fetch Bookmarks
   * ----------------------------- */
  const fetchBookmarks = useCallback(async () => {
    if (!token) return;
    try {
      setLoading(true);
      const res = await fetch("/api/bookmarks", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      if (!res.ok || !json.success)
        throw new Error(json.error || "Failed to fetch bookmarks");
      setBookmarks(json.bookmarks || []);
    } catch (err: any) {
      console.error("useBookmarks fetch error:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [token]);

  /** -----------------------------
   * 🟢 Fetch Read Later
   * ----------------------------- */
  const fetchReadLater = useCallback(async () => {
    if (!token) return;
    try {
      setLoading(true);
      const res = await fetch("/api/read-later", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      if (!res.ok || !json.success)
        throw new Error(json.error || "Failed to fetch read-later");
      setReadLater(json.items || []);
    } catch (err: any) {
      console.error("useReadLater fetch error:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [token]);

  /** -----------------------------
   * 🟡 Add Bookmark / Read Later
   * ----------------------------- */
  const addBookmark = useCallback(
    async (contentId: string) => {
      if (!token) throw new Error("You must be logged in to add a bookmark.");
      try {
        const res = await fetch("/api/bookmarks", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ content_id: contentId }),
        });
        const json = await res.json();
        if (!res.ok || !json.success)
          throw new Error(json.error || "Failed to add bookmark");
        await fetchBookmarks();
        return json.bookmark;
      } catch (err: any) {
        setError(err.message);
        throw err;
      }
    },
    [fetchBookmarks, token]
  );

  const addReadLater = useCallback(
    async (contentId: string) => {
      if (!token) throw new Error("You must be logged in to add to read later.");
      try {
        const res = await fetch("/api/read-later", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ content_id: contentId }),
        });
        const json = await res.json();
        if (!res.ok || !json.success)
          throw new Error(json.error || "Failed to add read-later item");
        await fetchReadLater();
        return json.item;
      } catch (err: any) {
        setError(err.message);
        throw err;
      }
    },
    [fetchReadLater, token]
  );

  /** -----------------------------
   * 🔴 Delete Bookmark / Read Later
   * ----------------------------- */
  const deleteBookmark = useCallback(
    async (id: string) => {
      if (!token) throw new Error("You must be logged in to remove a bookmark.");
      try {
        const res = await fetch(`/api/bookmarks/${id}`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        });
        const json = await res.json();
        if (!res.ok || !json.success)
          throw new Error(json.error || "Failed to delete bookmark");
        await fetchBookmarks();
        return true;
      } catch (err: any) {
        setError(err.message);
        throw err;
      }
    },
    [fetchBookmarks, token]
  );

  const deleteReadLater = useCallback(
    async (id: string) => {
      if (!token)
        throw new Error("You must be logged in to remove a read-later item.");
      try {
        const res = await fetch(`/api/read-later/${id}`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        });
        const json = await res.json();
        if (!res.ok || !json.success)
          throw new Error(json.error || "Failed to delete read-later item");
        await fetchReadLater();
        return true;
      } catch (err: any) {
        setError(err.message);
        throw err;
      }
    },
    [fetchReadLater, token]
  );

  /** -----------------------------
   * ♻️ Auto Fetch — Only Once
   * ----------------------------- */
  useEffect(() => {
    if (autoFetch && shouldFetch && !initialized) {
      setInitialized(true);
      fetchBookmarks();
      fetchReadLater();
    }
  }, [autoFetch, shouldFetch, initialized, fetchBookmarks, fetchReadLater]);

  /** -----------------------------
   * 🔁 Return API
   * ----------------------------- */
  return {
    bookmarks,
    readLater,
    loading,
    error,
    refetchBookmarks: fetchBookmarks,
    refetchReadLater: fetchReadLater,
    addBookmark,
    addReadLater,
    deleteBookmark,
    deleteReadLater,
  };
}
