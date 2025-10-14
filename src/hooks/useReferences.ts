// hooks/useReferences.ts
"use client";
import { useState, useEffect } from "react";

// Optional: Type for better TypeScript support (matches your API)
export type FlatReference = {
  id: string;
  text: string;
  created_at: Date | null;
  user_id: string;
  authorEmail: string | null;
};

export function useReferences(contentId: string) {
  const [references, setReferences] = useState<FlatReference[]>([]); // Typed version; use any[] if preferred
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchReferences = async () => {
    if (!contentId) {
      setReferences([]);
      return;
    }
    setLoading(true);
    setError(null); // Clear previous errors
    try {
      const res = await fetch(`/api/references?content_id=${contentId}`);
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      }
      const data = await res.json();
      if (data.success) {
        setReferences(data.references || []);
      } else {
        throw new Error(data.error || "Failed to fetch references");
      }
    } catch (err: unknown) {
      console.error("Fetch references error:", err);
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  const addReference = async (text: string) => {
    if (!contentId || !text.trim()) {
      setError("Content ID and text are required");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/references`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          // Add auth if needed: "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          content_id: contentId,
          text: text.trim(),
        }),
      });
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      }
      const data = await res.json();
      if (!data.success) throw new Error(data.error || "Failed to add reference");
      await fetchReferences(); // Refresh list
    } catch (err: unknown) {
      console.error("Add reference error:", err);
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReferences();
  }, [contentId]);

  return { 
    references, 
    loading, 
    error, 
    addReference, 
    refresh: fetchReferences 
  };
}
