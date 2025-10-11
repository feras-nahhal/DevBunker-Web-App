"use client";

import { useState, useEffect, useCallback } from "react";
import { AnyContent } from "@/types/content";
import { CONTENT_STATUS, CONTENT_TYPES } from "@/lib/enums";

export type ContentType = "post" | "mindmap" | "research" | "all";

interface UseContentOptions {
  type?: ContentType;
  filters?: Record<string, string>;
  autoFetch?: boolean;
}

export function useContent({
  type = "all",
  filters,
  autoFetch = true,
}: UseContentOptions = {}) {
  const [data, setData] = useState<AnyContent[]>([]);
  const [loading, setLoading] = useState<boolean>(autoFetch);
  const [error, setError] = useState<string | null>(null);

  const endpointMap: Record<Exclude<ContentType, "all">, string> = {
    post: "posts",
    mindmap: "mindmaps",
    research: "research",
  };

  /** -----------------------------
   * 🟢 Fetch all content (or filtered)
   * ----------------------------- */
  const fetchContent = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const query = filters ? `?${new URLSearchParams(filters).toString()}` : "";

      if (type === "all") {
        const [postsRes, mindmapsRes, researchRes] = await Promise.all([
          fetch(`/api/content/posts${query}`),
          fetch(`/api/content/mindmaps${query}`),
          fetch(`/api/content/research${query}`),
        ]);

        const [postsJson, mindmapsJson, researchJson] = await Promise.all([
          postsRes.json(),
          mindmapsRes.json(),
          researchRes.json(),
        ]);

        if (!postsJson.success || !mindmapsJson.success || !researchJson.success)
          throw new Error("Failed to load one or more content types.");

        const all = [
          ...(postsJson.posts || []),
          ...(mindmapsJson.mindmaps || []),
          ...(researchJson.research || []),
        ];
        setData(all);
      } else {
        const endpoint = endpointMap[type];
        const res = await fetch(`/api/content/${endpoint}${query}`);
        const json = await res.json();
        if (!res.ok || !json.success) throw new Error(json.error || `Failed to load ${type}`);
        setData(json[endpoint] || []);
      }
    } catch (err: any) {
      setError(err.message);
      console.error("useContent fetch error:", err);
    } finally {
      setLoading(false);
    }
  }, [type, filters]);

  /** -----------------------------
   * 🟣 Get single content by ID
   * ----------------------------- */
  const getContentById = useCallback(
    async (id: string) => {
      if (type === "all") throw new Error("Specify a content type for getById.");
      const endpoint = endpointMap[type];
      try {
        setLoading(true);
        const res = await fetch(`/api/content/${endpoint}/${id}`);
        const json = await res.json();
        if (!res.ok || !json.success) throw new Error(json.error || "Failed to get content");
        return json[endpoint.slice(0, -1)];
      } catch (err: any) {
        setError(err.message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [type]
  );

  /** -----------------------------
 * 🟡 Create
 * ----------------------------- */
const createContent = useCallback(
  async (
    newData: Partial<AnyContent> & { tag_ids?: string[]; status?: CONTENT_STATUS; },
    token?: string
  ) => {
    if (type === "all") throw new Error("Specify a content type for creation.");
    const endpoint = endpointMap[type];
    try {
      setLoading(true);
      const res = await fetch(`/api/content/${endpoint}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(newData),
      });
      const json = await res.json();
      if (!res.ok || !json.success)
        throw new Error(json.error || "Failed to create content");
      await fetchContent();
      return json[endpoint.slice(0, -1)];
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  },
  [type, fetchContent]
);


  /** -----------------------------
   * 🔵 Update
   * ----------------------------- */
  const updateContent = useCallback(
    async (id: string, updates: Partial<AnyContent>, token?: string) => {
      if (type === "all") throw new Error("Specify a content type for updating.");
      const endpoint = endpointMap[type];
      try {
        setLoading(true);
        const res = await fetch(`/api/content/${endpoint}/${id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify(updates),
        });
        const json = await res.json();
        if (!res.ok || !json.success) throw new Error(json.error || "Failed to update content");
        await fetchContent();
        return json.updated;
      } catch (err: any) {
        setError(err.message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [type, fetchContent]
  );

  /** -----------------------------
   * 🔴 Delete
   * ----------------------------- */
  const deleteContent = useCallback(
    async (id: string, token?: string) => {
      if (type === "all") throw new Error("Specify a content type for deletion.");
      const endpoint = endpointMap[type];
      try {
        setLoading(true);
        const res = await fetch(`/api/content/${endpoint}/${id}`, {
          method: "DELETE",
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        const json = await res.json();
        if (!res.ok || !json.success) throw new Error(json.error || "Failed to delete content");
        await fetchContent();
        return true;
      } catch (err: any) {
        setError(err.message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [type, fetchContent]
  );

  /** -----------------------------
   * 🟠 Request Research Approval
   * ----------------------------- */
  const requestApproval = useCallback(
    async (id: string, token?: string) => {
      if (type !== "research") throw new Error("Approval can only be requested for research.");
      try {
        setLoading(true);
        const res = await fetch(`/api/content/research/${id}/request-approval`, {
          method: "POST",
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        const json = await res.json();
        if (!res.ok || !json.success)
          throw new Error(json.error || "Failed to request approval");
        await fetchContent();
        return true;
      } catch (err: any) {
        setError(err.message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [type, fetchContent]
  );

  /** -----------------------------
   * ♻️ Auto Fetch
   * ----------------------------- */
  useEffect(() => {
    if (autoFetch) fetchContent();
  }, [fetchContent, autoFetch]);

  return {
    data,
    loading,
    error,
    refetch: fetchContent,
    getContentById,
    createContent,
    updateContent,
    deleteContent,
    requestApproval,
  };
}
