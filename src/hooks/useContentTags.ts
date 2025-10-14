"use client";

import { useState, useEffect } from "react";
import { useAuth } from "./useAuth"; // Your auth hook
import { useTags } from "./useTags"; // Your existing tags hook (for search/validation)

interface Tag {
  id: string;
  name: string;
}

interface UseContentTagsProps {
  contentId: string;
}

interface ApiResult {
  success: boolean;
  error?: string;
  tags?: Tag[]; // For GET
  tag?: Tag; // For POST
}

export function useContentTags({ contentId }: UseContentTagsProps) {
  const { token } = useAuth();
  const { tags: allTags, searchTags } = useTags(); // Reuse for search and validation

  // Helper function to get a tag by ID
  const getTagById = (tagId: string): Tag | undefined => {
    return allTags.find(tag => tag.id === tagId);
  };

  const [selectedTags, setSelectedTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch initial selected tags (id + name)
  const fetchSelectedTags = async () => {
    if (!contentId || !token) return;
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/content/${contentId}/tags`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data: ApiResult = await response.json();
      if (data.success) {
        setSelectedTags(data.tags || []);
      } else {
        throw new Error(data.error || "Failed to fetch tags");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
      setSelectedTags([]);
    } finally {
      setLoading(false);
    }
  };

  // Add tag (POST)
  const addTag = async (tagId: string): Promise<ApiResult> => {
    if (!contentId || !token || !tagId) {
      return { success: false, error: "Missing contentId, token, or tagId" };
    }
    const tag = getTagById(tagId); // Validate via useTags
    if (!tag) return { success: false, error: "Tag not found" };

    try {
      const response = await fetch(`/api/content/${contentId}/tags`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ tagId }),
      });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || `HTTP ${response.status}`);
      }
      const data: ApiResult = await response.json();
      if (data.success) {
        // Optimistic update
        if (!selectedTags.some(t => t.id === tagId)) {
          setSelectedTags(prev => [...prev, { id: tagId, name: tag.name }]);
        }
        return { success: true, tag: data.tag };
      } else {
        return { success: false, error: data.error || "Failed to add tag" };
      }
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : "Unknown error";
      return { success: false, error: errMsg };
    }
  };

  // Remove tag (DELETE)
  const removeTag = async (tagId: string): Promise<ApiResult> => {
    if (!contentId || !token || !tagId) {
      return { success: false, error: "Missing contentId, token, or tagId" };
    }

    try {
      const response = await fetch(`/api/content/${contentId}/tags/${tagId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || `HTTP ${response.status}`);
      }
      const data: ApiResult = await response.json();
      if (data.success) {
        // Optimistic update
        setSelectedTags(prev => prev.filter(t => t.id !== tagId));
        return { success: true };
      } else {
        return { success: false, error: data.error || "Failed to remove tag" };
      }
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : "Unknown error";
      return { success: false, error: errMsg };
    }
  };

  // Load on mount
  useEffect(() => {
    fetchSelectedTags();
  }, [contentId]);

  return {
    selectedTags,
    loading,
    error,
    addTag,
    removeTag,
    refetch: fetchSelectedTags, // Manual refresh
    // For search: Use useTags' searchTags or client-side filter on allTags
  };
}