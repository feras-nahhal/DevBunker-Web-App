"use client";

import { useState, useEffect } from "react";
import { useAuthContext } from "./AuthProvider";

interface Category {
  id: string; // UUID from schema
  name: string;
  description?: string | null; // Nullable from schema (unlike tags)
  status: string; // "approved" from API
  created_by?: string; // Optional UUID
  created_at?: Date; // Optional timestamp
}

interface CategoryRequest {
  id: string;
  name: string;
  description?: string | null;
  status: string;
  created_by?: string;
  created_at?: string;
}

interface RequestResult {
  success: boolean;
  error?: string;
  request?: CategoryRequest;
}

export function useCategories() {
  const { token} = useAuthContext();

  // useState for GET data management
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Inline function for GET /api/categories or /api/categories/search?q=
  const fetchCategories = async (query: string = "") => {
    setLoading(true);
    setError(null);
    try {
      const url = query ? `/api/categories/search?q=${encodeURIComponent(query)}` : `/api/categories`;
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
        const parsed = (data.categories || []).map((cat: unknown) => {
          const category = cat as Category;
          return {
            ...category,
            created_at: category.created_at ? new Date(category.created_at) : undefined,
          };
        });
        setCategories(parsed);
      } else {
        throw new Error(data.error || "Failed to fetch categories");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
      setCategories([]);
    } finally {
      setLoading(false);
    }
  };

  // useEffect: Initial GET /api/categories on mount (full approved list)
  useEffect(() => {
    fetchCategories();
  }, []);

  // Function for GET /api/categories/search?q= (search approved categories)
  const searchCategories = (query: string) => {
    fetchCategories(query);
  };

  // Function for GET /api/categories refetch (list approved categories)
  const refetch = () => {
    fetchCategories();
  };

  // Function for POST /api/categories/request (request new category) - Fixed endpoint to match route
  const requestNewCategory = async (categoryName: string, description?: string): Promise<RequestResult> => {
    if (!categoryName?.trim()) {
      return { success: false, error: "category_name is required" };
    }

    // Check for token - require auth for requests
    if (!token) {
      console.log("No token found - user not authenticated"); // Debug log
      return { success: false, error: "Please log in to request categories." };
    }

    try {
      console.log("Requesting category with token:", categoryName); // Debug log (token masked)
      const response = await fetch("/api/categories/request", { // ✅ Fixed: Matches your route file (plural + no extra slash)
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`, // ✅ Pass the token here
        },
        body: JSON.stringify({ 
          category_name: categoryName.trim(), 
          description: description || null 
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({})); // Try to parse error body
        let errMsg = `HTTP ${response.status}`;
        if (response.status === 404) {
          errMsg = "Endpoint not found - check server routes (should be /api/categories/request)."; // Specific for debugging
        } else if (response.status === 401) {
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
        console.log("Category request success:", data.request); // Debug log
        return { success: true, request: data.request };
      } else {
        return { success: false, error: data.error || "Failed to request category" };
      }
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : "Unknown error";
      console.error("Category request failed:", errMsg); // Debug log
      return { success: false, error: errMsg };
    }
  };

  return { 
    categories, 
    loading, 
    error, 
    searchCategories, 
    refetch, 
    requestNewCategory 
  };
}
