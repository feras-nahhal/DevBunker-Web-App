"use client";

import { useState, useEffect, useCallback } from "react";
import { TAG_CATEGORY_STATUS } from "@/lib/enums"; // Import enum for typing

// Type for category request (matches API response)
interface CategoryRequest {
  id: string;
  category_name: string; // From API (category_name)
  user_id: string;
  status: TAG_CATEGORY_STATUS; // Enum type (lowercase: "pending" | "approved" | "rejected")
  created_at: string; // ISO string or Date
  authorEmail?: string; // From users join (optional)
}

interface UseAdminCategoriesOptions {
  autoFetch?: boolean; // Default true
}

export function useAdminCategories({ autoFetch = true }: UseAdminCategoriesOptions = {}) {
  const [requests, setRequests] = useState<CategoryRequest[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // SSR-safe token getter (FIXED: "" → "undefined")
  const getToken = useCallback(() => {
    if (typeof window === "undefined") return null; // FIXED: Correct SSR check
    return localStorage.getItem("token") || null;
  }, []);

  /** 🟢 Fetch category requests (GET /api/admin/categories/requests) */
const fetchRequests = useCallback(async () => {
  if (typeof window === "undefined") return;
  try {
    setLoading(true);
    setError(null);
    const token = getToken();
    if (!token) throw new Error("Authentication required (no token)");

    console.log("Hook: Starting fetch with token:", token ? "present" : "missing"); // DEBUG: Token check

    const res = await fetch("/api/admin/categories/requests", {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store", // Fresh data
    });

    if (!res.ok) {
      throw new Error(`HTTP ${res.status}: ${res.statusText}`);
    }

    const json = await res.json();
    console.log("Hook: Raw API response:", json); // DEBUG: Full response (check category_name here)

    if (!json.success) throw new Error(json.error || "Failed to fetch category requests");

    // Map API response to CategoryRequest (ensure status matches enum – lowercase)
    const mappedRequests: CategoryRequest[] = (json.requests || []).map(
      (item: Partial<CategoryRequest> & Record<string, unknown>) => ({
        ...item,
        category_name: String(item.category_name ?? ""),
        status: String(item.status ?? "pending").toLowerCase() as TAG_CATEGORY_STATUS,
        authorEmail: item.authorEmail ? String(item.authorEmail) : undefined,
      })
    );

    console.log("Hook: Mapped requests (first item):", mappedRequests[0]); // DEBUG: Check category_name after mapping
    console.log("Hook: Total mapped requests:", mappedRequests.length); // DEBUG: Should be 10

    setRequests(mappedRequests);
  } catch (err: unknown) {
    const errMsg = err instanceof Error ? err.message : "Unknown fetch error";
    setError(errMsg);
    console.error("useAdminCategories fetch error:", err); // This logs if fetch fails
    setRequests([]); // Clear on error
  } finally {
    setLoading(false);
  }
}, [getToken]);


  /** ✅ Approve category request (PUT /api/admin/categories/[id]/approve) */
  const approveCategory = useCallback(
    async (requestId: string) => {
      if (typeof window === "undefined") throw new Error("Cannot approve on server");
      const token = getToken();
      if (!token) throw new Error("Authentication required");

      try {
        setLoading(true);
        setError(null);
        const res = await fetch(`/api/admin/categories/${requestId}/approve`, {
          method: "PUT",
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!res.ok) {
          throw new Error(`HTTP ${res.status}: ${res.statusText}`);
        }

        const json = await res.json();
        if (!json.success) throw new Error(json.error || "Failed to approve category request");

        console.log("Category request approved:", requestId); // Debug
        window.location.reload(); // Reload for fresh data (updates UI status)
        return json; // { success, message, category }
      } catch (err: unknown) {
        const errMsg = err instanceof Error ? err.message : "Unknown approve error";
        setError(errMsg);
        console.error("useAdminCategories approveCategory error:", err);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [getToken]
  );

  /** ❌ Reject category request (PUT /api/admin/categories/[id]/reject) */
  const rejectCategory = useCallback(
    async (requestId: string) => {
      if (typeof window === "undefined") throw new Error("Cannot reject on server");
      const token = getToken();
      if (!token) throw new Error("Authentication required");

      try {
        setLoading(true);
        setError(null);
        const res = await fetch(`/api/admin/categories/${requestId}/reject`, {
          method: "PUT",
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!res.ok) {
          throw new Error(`HTTP ${res.status}: ${res.statusText}`);
        }

        const json = await res.json();
        if (!json.success) throw new Error(json.error || "Failed to reject category request");

        console.log("Category request rejected:", requestId); // Debug
        window.location.reload(); // Reload for fresh data (updates UI status)
        return json; // { success, message }
      } catch (err: unknown) {
        const errMsg = err instanceof Error ? err.message : "Unknown reject error";
        setError(errMsg);
        console.error("useAdminCategories rejectCategory error:", err);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [getToken]
  );

  /** ➕ Create new category (POST /api/admin/categories) */
  const createCategory = useCallback(
    async (name: string, description?: string) => {
      if (typeof window === "undefined") throw new Error("Cannot create on server");
      const token = getToken();
      if (!token) throw new Error("Authentication required");
      if (!name.trim()) throw new Error("Category name is required");

      try {
        setLoading(true);
        setError(null);
        const res = await fetch("/api/admin/categories", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ 
            name: name.trim(), 
            description: description || null // Optional description
          }),
        });

        if (!res.ok) {
          throw new Error(`HTTP ${res.status}: ${res.statusText}`);
        }

        const json = await res.json();
        if (!json.success) throw new Error(json.error || "Failed to create category");

        console.log("Category created:", name); // Debug
        window.location.reload(); // Reload after create
        return json.category; // { success, category }
      } catch (err: unknown) {
        const errMsg = err instanceof Error ? err.message : "Unknown create error";
        setError(errMsg);
        console.error("useAdminCategories createCategory error:", err);
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
    requests, // Array of CategoryRequest objects
    loading,
    error,
    refetch: fetchRequests, // Manual refresh
    approveCategory,
    rejectCategory,
    createCategory,
  };
}
