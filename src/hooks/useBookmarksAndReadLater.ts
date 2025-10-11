"use client";

import { useState, useEffect, useCallback } from "react";
import { Bookmark, ReadLater } from "@/types/content";

interface UseSavedContentOptions {
  autoFetch?: boolean;
}

export function useBookmarksAndReadLater({ autoFetch = true }: UseSavedContentOptions = {}) {
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [readLater, setReadLater] = useState<ReadLater[]>([]);
  const [loading, setLoading] = useState<boolean>(autoFetch);
  const [error, setError] = useState<string | null>(null);

  const token =
    typeof window !== "undefined"
      ? localStorage.getItem("token") || undefined
      : undefined;

  /** -----------------------------
   * 🟢 Fetch Bookmarks & Read Later
   * ----------------------------- */
  const fetchBookmarks = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch("/api/bookmarks", {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error || "Failed to fetch bookmarks");
      setBookmarks(json.bookmarks || []);
    } catch (err: any) {
      setError(err.message);
      console.error("useBookmarks fetch error:", err);
    } finally {
      setLoading(false);
    }
  }, [token]);

  const fetchReadLater = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch("/api/read-later", {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error || "Failed to fetch read-later items");
      setReadLater(json.items || []);
    } catch (err: any) {
      setError(err.message);
      console.error("useReadLater fetch error:", err);
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
        if (!res.ok || !json.success) throw new Error(json.error || "Failed to add bookmark");
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
        if (!res.ok || !json.success) throw new Error(json.error || "Failed to add read-later item");
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
        if (!res.ok || !json.success) throw new Error(json.error || "Failed to delete bookmark");
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
      if (!token) throw new Error("You must be logged in to remove a read-later item.");
      try {
        const res = await fetch(`/api/read-later/${id}`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        });
        const json = await res.json();
        if (!res.ok || !json.success) throw new Error(json.error || "Failed to delete read-later item");
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
   * ♻️ Auto Fetch
   * ----------------------------- */
  useEffect(() => {
    if (autoFetch) {
      fetchBookmarks();
      fetchReadLater();
    }
  }, [fetchBookmarks, fetchReadLater, autoFetch]);

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
