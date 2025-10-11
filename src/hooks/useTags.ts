"use client";

import { useState, useEffect } from "react";
import { useAuth } from "./useAuth"; // Import your useAuth hook

interface Tag {
  id: string; // UUID from schema
  name: string;
  status: string; // "approved" from API
  created_by?: string; // Optional UUID
  created_at?: Date; // Optional timestamp
}

interface RequestResult {
  success: boolean;
  error?: string;
  request?: any; // The inserted request object from API (if success)
}

export function useTags() {
  const { token } = useAuth(); // Get token from useAuth (SSR-safe)

  // useState for GET data management
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Inline function for GET /api/tags or /api/tags/search?q=
  const fetchTags = async (query: string = "") => {
    setLoading(true);
    setError(null);
    try {
      const url = query ? `/api/tags/search?q=${encodeURIComponent(query)}` : `/api/tags`;
      const headers: HeadersInit = {};
      if (token) {
        headers.Authorization = `Bearer ${token}`; // Include token for authenticated GETs (if needed)
      }
      const response = await fetch(url, { headers });
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      const data = await response.json();
      if (data.success) {
        const parsed = (data.tags || []).map((tag: any) => ({
          ...tag,
          created_at: tag.created_at ? new Date(tag.created_at) : undefined,
        }));
        setTags(parsed);
      } else {
        throw new Error(data.error || "Failed to fetch tags");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
      setTags([]);
    } finally {
      setLoading(false);
    }
  };

  // useEffect: Initial GET /api/tags on mount (full approved list)
  useEffect(() => {
    fetchTags();
  }, []);

  // Function for GET /api/tags/search?q= (search approved tags)
  const searchTags = (query: string) => {
    fetchTags(query);
  };

  // Function for GET /api/tags refetch (list approved tags)
  const refetch = () => {
    fetchTags();
  };

  // Function for POST /api/tags/request (request new tag)
  const requestNewTag = async (tagName: string, description?: string): Promise<RequestResult> => {
    if (!tagName?.trim()) {
      return { success: false, error: "tag_name is required" };
    }

    // Check for token - require auth for requests
    if (!token) {
      console.log("No token found - user not authenticated"); // Debug log
      return { success: false, error: "Please log in to request tags." };
    }

    try {
      console.log("Requesting tag with token:", tagName); // Debug log (token masked)
      const response = await fetch("/api/tags/request", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`, // ✅ Pass the token here
        },
        body: JSON.stringify({ 
          tag_name: tagName.trim(), 
          description: description || null 
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({})); // Try to parse error body
        let errMsg = `HTTP ${response.status}`;
        if (response.status === 401) {
          errMsg = "Session expired - please log in again.";
          // Optional: Clear invalid token
          if (typeof window !== 'undefined') localStorage.removeItem("token");
        } else if (errorData.error) {
          errMsg = errorData.error;
        }
        throw new Error(errMsg);
      }

      const data = await response.json();
      if (data.success) {
        // Auto-refetch approved list (pending won't show until approved)
        refetch();
        console.log("Tag request success:", data.request); // Debug log
        return { success: true, request: data.request };
      } else {
        return { success: false, error: data.error || "Failed to request tag" };
      }
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : "Unknown error";
      console.error("Tag request failed:", errMsg); // Debug log
      return { success: false, error: errMsg };
    }
  };

  return { 
    tags, 
    loading, 
    error, 
    searchTags, 
    refetch, 
    requestNewTag 
  };
}
