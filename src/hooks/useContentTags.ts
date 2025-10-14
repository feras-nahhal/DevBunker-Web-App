"use client";

import { useState } from "react";

export interface ContentTag {
  id: string;
  name: string;
  status?: string;
  created_at?: string;
}

export function useContentTags() {
  const [tags, setTags] = useState<ContentTag[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTags = async (contentId: string) => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/content-tags?contentId=${contentId}`);
      if (!res.ok) throw new Error(`Failed to fetch tags: ${res.status}`);
      const data = await res.json();

      if (data.success) {
        setTags(data.tags || []);
      } else {
        setError(data.message || "Failed to fetch tags");
      }
    } catch (err) {
      console.error("Error fetching tags:", err);
      setError("Error fetching tags");
    } finally {
      setLoading(false);
    }
  };

  return { tags, loading, error, fetchTags };
}
