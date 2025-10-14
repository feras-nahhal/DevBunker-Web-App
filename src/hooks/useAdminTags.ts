"use client";

import { useState, useEffect, useCallback } from "react";
import { TAG_CATEGORY_STATUS } from "@/lib/enums"; // NEW: Import enum for typing

// Type for tag request (now uses enum for status)
interface TagRequest {
  id: string;
  tag_name: string;
  user_id: string;
  status: TAG_CATEGORY_STATUS; // FIXED: Use enum type (lowercase: "pending" | "approved" | "rejected")
  created_at: string; // or Date
  authorEmail?: string; // From API join (optional)
}

interface UseAdminTagsOptions {
  autoFetch?: boolean; // Default true
}

export function useAdminTags({ autoFetch = true }: UseAdminTagsOptions = {}) {
  const [requests, setRequests] = useState<TagRequest[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // FIXED: SSR-safe token getter
  const getToken = useCallback(() => {
    if (typeof window === "undefined") return null;
    return localStorage.getItem("token") || null;
  }, []);

  /** 🟢 Fetch pending tag requests (GET /api/admin/tags/requests) */
  const fetchRequests = useCallback(async () => {
    if (typeof window === "undefined") return; // FIXED: Client-only
    try {
      setLoading(true);
      setError(null);
      const token = getToken();
      if (!token) throw new Error("Authentication required (no token)");

      const res = await fetch("/api/admin/tags/requests", {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store", // FIXED: Fresh data
      });

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      }

      const json = await res.json();
      if (!json.success) throw new Error(json.error || "Failed to fetch tag requests");

      // FIXED: Map API response to TagRequest type (ensure status matches enum – lowercase)
      const mappedRequests: TagRequest[] = (json.requests || []).map(
        (item: Record<string, unknown>) => ({
          ...item,
          status: String(item.status).toLowerCase() as TAG_CATEGORY_STATUS, // Ensure lowercase enum match
          authorEmail:
            typeof item.authorEmail === "string" ? item.authorEmail : undefined,
        })
      );


      setRequests(mappedRequests);
      console.log("Tag requests fetched:", mappedRequests.length); // Debug (remove in prod)
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : "Unknown fetch error";
      setError(errMsg);
      console.error("useAdminTags fetch error:", err);
      setRequests([]); // Clear on error
    } finally {
      setLoading(false);
    }
  }, [getToken]);

  /** ✅ Approve tag request (PUT /api/admin/tags/[id]/approve) */
  const approveTag = useCallback(
    async (requestId: string) => {
      if (typeof window === "undefined") throw new Error("Cannot approve on server");
      const token = getToken();
      if (!token) throw new Error("Authentication required");

      try {
        setLoading(true);
        setError(null);
        const res = await fetch(`/api/admin/tags/${requestId}/approve`, {
          method: "PUT",
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!res.ok) {
          throw new Error(`HTTP ${res.status}: ${res.statusText}`);
        }

        const json = await res.json();
        if (!json.success) throw new Error(json.error || "Failed to approve tag request");

        console.log("Tag request approved:", requestId); // Debug
        window.location.reload(); // FIXED: Reload for fresh data (per request – updates UI status)
        return json; // Return { success, message, tag/request }
      } catch (err: unknown) {
        const errMsg = err instanceof Error ? err.message : "Unknown fetch error";
        setError(errMsg);
        console.error("approveTag error:", err);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [getToken]
  );

  /** ❌ Reject tag request (PUT /api/admin/tags/[id]/reject) */
  const rejectTag = useCallback(
    async (requestId: string) => {
      if (typeof window === "undefined") throw new Error("Cannot reject on server");
      const token = getToken();
      if (!token) throw new Error("Authentication required");

      try {
        setLoading(true);
        setError(null);
        const res = await fetch(`/api/admin/tags/${requestId}/reject`, {
          method: "PUT",
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!res.ok) {
          throw new Error(`HTTP ${res.status}: ${res.statusText}`);
        }

        const json = await res.json();
        if (!json.success) throw new Error(json.error || "Failed to reject tag request");

        console.log("Tag request rejected:", requestId); // Debug
        window.location.reload(); // FIXED: Reload for fresh data (per request – updates UI status)
        return json; // Return { success, message, request }
      } catch (err: unknown) {
        const errMsg = err instanceof Error ? err.message : "Unknown fetch error";
        setError(errMsg);
        console.error("rejectTag error:", err);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [getToken]
  );

  /** 🗑️ Delete tag request (DELETE /api/admin/tags/[id]) – NEW */
  const deleteTag = useCallback(
    async (tagId: string) => {
      if (typeof window === "undefined") throw new Error("Cannot delete on server");
      const token = getToken();
      if (!token) throw new Error("Authentication required");

      try {
        setLoading(true);
        setError(null);
        const res = await fetch(`/api/admin/tags/${tagId}`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!res.ok) {
          throw new Error(`HTTP ${res.status}: ${res.statusText}`);
        }

        const json = await res.json();
        if (!json.success) throw new Error(json.error || "Failed to delete tag request");

        console.log("Tag request deleted:", tagId); // Debug
        window.location.reload(); // FIXED: Reload for fresh data (per request)
        return json; // Return { success, message, deleted }
      } catch (err: unknown) {
        const errMsg = err instanceof Error ? err.message : "Unknown fetch error";
        setError(errMsg);
        console.error("deleteTag error:", err);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [getToken]
  );

  /** ➕ Create new tag (POST /api/admin/tags) */
  const createTag = useCallback(
    async (tagName: string) => {
      if (typeof window === "undefined") throw new Error("Cannot create on server");
      const token = getToken();
      if (!token) throw new Error("Authentication required");
      if (!tagName.trim()) throw new Error("Tag name is required");

      try {
        setLoading(true);
        setError(null);
        const res = await fetch("/api/admin/tags", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ name: tagName.trim() }),
        });

        if (!res.ok) {
          throw new Error(`HTTP ${res.status}: ${res.statusText}`);
        }

        const json = await res.json();
        if (!json.success) throw new Error(json.error || "Failed to create tag");

        console.log("Tag created:", tagName); // Debug
        window.location.reload(); // FIXED: Reload after create
        return json.tag; // Return created tag object
      } catch (err: unknown) {
        const errMsg = err instanceof Error ? err.message : "Unknown fetch error";
        setError(errMsg);
        console.error("createTag error:", err);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [getToken]
  );

  /** ♻️ Auto-fetch on mount (client-only) */
  useEffect(() => {
    if (typeof window === "undefined" || !autoFetch) return;
    fetchRequests();
  }, [fetchRequests, autoFetch]);

  return {
    requests, // Array of TagRequest objects (status typed as TAG_CATEGORY_STATUS)
    loading,
    error,
    refetch: fetchRequests, // Manual refresh (optional now with reload)
    approveTag,
    rejectTag,
    deleteTag, // NEW: Delete method
    createTag,
  };
}
