"use client";
import { useState } from "react";
import { useContent } from "@/hooks/useContent";
import { useAuth } from "@/hooks/useAuth";
import DraftCard from "./DraftCard";
import { AnyContent, Comment } from "@/types/content";
import ContentPopup from "./ContentPopup"; // ✅ ensure path is correct

interface DraftGridProps {
  type?: "all" | "post" | "research" | "mindmap";
  searchQuery?: string; // Raw search for display
  filters?: Record<string, string>; // Includes q (debounced), status, category
}

export default function DraftGrid({ 
  type = "all", 
  searchQuery = "", 
  filters = {} 
}: DraftGridProps) {
  // Pass combined filters to useContent (q is already debounced in parent; status defaults to "draft")
  const { data, loading, error, refetch } = useContent({ type, filters });
  const { user } = useAuth();

 
  const [selectedContentPopup, setSelectedContentPopup] = useState<AnyContent | null>(null);
    const handleOpenContentPopup = (content: AnyContent) => {
    setSelectedContentPopup(content);
    };


  const token =
    typeof window !== "undefined" // FIXED: Typo was "" -> "undefined"
      ? localStorage.getItem("token") || undefined
      : undefined;

  

  // ✅ Determine API path for deleting content
  const getApiPath = (contentType: "post" | "mindmap" | "research") => {
    switch (contentType) {
      case "post":
        return "posts";
      case "mindmap":
        return "mindmaps";
      case "research":
        return "research";
      default:
        return contentType;
    }
  };

  // ✅ Delete content handler
  const handleDelete = async (
    id: string,
    contentType: "post" | "mindmap" | "research"
  ) => {
    try {
      if (!token) {
        alert("You must be logged in to delete content.");
        return;
      }

      const apiPath = getApiPath(contentType);
      const endpoint = `/api/content/${apiPath}/${id}`;

      const res = await fetch(endpoint, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) throw new Error(`Failed to delete ${contentType}`);
      await refetch();
    } catch (err) {
      console.error("Error deleting item:", err);
      alert("Failed to delete item.");
    }
  };

  // UPDATED: UX text for results (highlight default draft status)
  const totalResults = data.length;
  const hasSearch = !!searchQuery.trim();
  const hasFilters = !!(filters.status || filters.category);
  const isDefaultDraft = filters.status === "draft" && !hasSearch && !filters.category;
  const resultsText = hasSearch || hasFilters
    ? `Showing ${totalResults} results${hasSearch ? ` for "${searchQuery}"` : ""}${filters.status ? ` (Status: ${filters.status})` : ""}${filters.category ? ` (Category ID: ${filters.category})` : ""}.`
    : isDefaultDraft 
      ? `Showing all ${totalResults} draft items.` // NEW: Specific UX for default draft
      : `Showing all ${totalResults} items.`;

  // ✅ Loading and error states
  if (loading)
    return (
      <div className="flex justify-center py-10 text-gray-400 text-lg">
        Loading content...
      </div>
    );

  if (error)
    return (
      <div className="flex justify-center py-10 text-red-500">
        Error: {error}
      </div>
    );

  if (!data.length)
    return (
      <div className="flex justify-center py-10 text-gray-400">
        {hasSearch || hasFilters
          ? `No ${type === "all" ? "content" : type} matches your search or filters.`
          : isDefaultDraft
            ? "No draft content available." // NEW: Specific message for default draft
            : `No ${type === "all" ? "content" : type} available.`
        }
      </div>
    );

  // ✅ Render content grid
  return (
    <>
      {/* NEW: Results summary */}
      <div className="mb-4 text-center text-gray-400 text-sm">
        {resultsText}
      </div>

      <div
        className="
          grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4
          gap-x-[2px] gap-y-[-10px]
          place-items-center
        "
        style={{
          width: "100%",
          maxWidth: "1429px",
          margin: "0 auto",
          overflowX: "hidden",
          boxSizing: "border-box",
        }}
      >
        {data.map((card) => {
          const contentType = card.content_type as
            | "post"
            | "mindmap"
            | "research";

          return (
            <div
              key={card.id}
              style={{
                width: "360px",
                transform: "scale(0.9)",
                transformOrigin: "top center",
              }}
            >
              <DraftCard
                {...card}
                type={contentType}
                categoryName={
                  typeof card.categoryName === "string"
                    ? [card.categoryName]
                    : card.categoryName
                }
                onOpenContent={() => handleOpenContentPopup(card)} // ✅ pass this 
              />
            </div>
          );
        })}
      </div>

      {/* 🟣 Content Popup */}
                        {selectedContentPopup && (
                          <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[9999] flex justify-center items-center">
                            <div className="relative w-[80%] max-w-[800px] max-h-[85vh] overflow-y-auto bg-[#1a1a1a] rounded-2xl border border-white/10 shadow-lg p-6">
                              <button
                                onClick={() => setSelectedContentPopup(null)}
                                className="absolute top-4 right-4 text-gray-400 hover:text-white text-2xl"
                              >
                                ✕
                              </button>
                  
                              <ContentPopup
                                id={selectedContentPopup.id}
                                title={selectedContentPopup.title}
                                content_body={
                                  "content_body" in selectedContentPopup
                                    ? selectedContentPopup.content_body || ""
                                    : ""
                                }
                                onClose={() => setSelectedContentPopup(null)}
                                created_at={selectedContentPopup.created_at}
                                updated_at={selectedContentPopup.updated_at}
                                status={selectedContentPopup.status}
                                excalidraw_data={selectedContentPopup.excalidraw_data}
                                categoryName={
                                    typeof selectedContentPopup.categoryName === "string"
                                      ? [selectedContentPopup.categoryName]
                                      : selectedContentPopup.categoryName
                                  }
                                
                              />
                            </div>
                          </div>
                        )}
    </>
  );
}
