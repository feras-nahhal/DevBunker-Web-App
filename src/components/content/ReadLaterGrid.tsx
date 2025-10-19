"use client";

import { useState } from "react"; // Added for popup state
import ReadlaterCard from "./ReadlaterCard";
import CommentsPopup from "./CommentsPopup"; // NEW: For comments popup
import { useBookmarksAndReadLater } from "@/hooks/useBookmarksAndReadLater";
import { useContent } from "@/hooks/useContent";
import { useAuth } from "@/hooks/useAuth"; // NEW: For user/token if needed
import { AnyContent, Comment } from "@/types/content";
import ContentPopup from "./ContentPopup"; // ✅ ensure path is correct

interface ReadLaterGridProps {
  searchQuery?: string; // NEW: Raw search query from parent (for client-side filtering)
  filters?: Record<string, string>; // NEW: For status/category filtering (client-side)
}

export default function ReadLaterGrid({ 
  searchQuery = "", 
  filters = {} 
}: ReadLaterGridProps) {
  const { readLater, loading, error, refetchReadLater } = useBookmarksAndReadLater({ autoFetch: true });
  const { data: allContent, refetch } = useContent({ type: "all", autoFetch: true });
  const { user } = useAuth(); // NEW: If needed for auth checks

  // NEW: State for comments popup
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [selectedContent, setSelectedContent] = useState<AnyContent | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [selectedContentPopup, setSelectedContentPopup] = useState<AnyContent | null>(null);
    const handleOpenContentPopup = (content: AnyContent) => {
    setSelectedContentPopup(content);
    };

  // FIXED: Token check (was !== "" -> !== "undefined")
  const token =
    typeof window !== "undefined"
      ? localStorage.getItem("token") || undefined
      : undefined;

  // Match read-later content (existing)
  let readLaterContent = readLater
    .map((r) => allContent.find((c) => c.id === r.content_id))
    .filter(Boolean) as typeof allContent;

  // NEW: Client-side search filtering (by title, case-insensitive)
  if (searchQuery.trim()) {
    readLaterContent = readLaterContent.filter((item) =>
      item.title.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }

  // NEW: Client-side filtering for status and category (from filters prop)
  if (filters.status) {
    readLaterContent = readLaterContent.filter((item) => item.status === filters.status);
  }
  if (filters.category) {
    readLaterContent = readLaterContent.filter((item) => item.category_id === filters.category);
  }

  /** 🗨️ Comments */
  const fetchComments = async (contentId: string) => {
    try {
      const res = await fetch(`/api/comments?content_id=${contentId}`);
      const json = await res.json();
      if (json.success) setComments(json.comments || []);
      else setComments([]);
    } catch (err) {
      console.error("Error fetching comments:", err);
      setComments([]);
    }
  };

  const handleOpenComments = async (content: AnyContent) => {
    setSelectedContent(content);
    await fetchComments(content.id);
    setIsPopupOpen(true);
  };

  const handleAddComment = async (text: string, parentId?: string) => {
    if (!token) return alert("You must be logged in to comment.");
    if (!selectedContent) return;

    try {
      const res = await fetch(`/api/comments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          content_id: selectedContent.id,
          text,
          parent_id: parentId || null,
        }),
      });

      const json = await res.json();
      if (json.success) await fetchComments(selectedContent.id);
    } catch (err) {
      console.error("Failed to post comment:", err);
      alert("Failed to post comment.");
    }
  };

  const getApiPath = (contentType: "post" | "mindmap" | "research") => {
    switch (contentType) {
      case "post": return "posts";
      case "mindmap": return "mindmaps";
      case "research": return "research";
    }
  };

  const handleDelete = async (contentId: string, contentType: "post" | "mindmap" | "research") => {
    if (!token) { alert("You must be logged in to delete content."); return; }
    try {
      const apiPath = getApiPath(contentType);
      const res = await fetch(`/api/content/${apiPath}/${contentId}`, { 
        method: "DELETE", 
        headers: { Authorization: `Bearer ${token}` } 
      });
      if (!res.ok) throw new Error("Failed to delete content");

      const readLaterItem = readLater.find((r) => r.content_id === contentId);
      if (readLaterItem) {
        await fetch(`/api/read-later/${readLaterItem.id}`, { 
          method: "DELETE", 
          headers: { Authorization: `Bearer ${token}` } 
        });
      }

      await refetch();
      await refetchReadLater();
    } catch (err) {
      console.error(err);
      alert("Failed to delete item.");
    }
  };

  // NEW: UX text for results (with search + filter support, same as BookmarksGrid)
  const totalResults = readLaterContent.length;
  const hasSearch = !!searchQuery.trim();
  const hasFilters = !!(filters.status || filters.category);
  const resultsText = hasSearch || hasFilters
    ? `Showing ${totalResults} read-later items${hasSearch ? ` for "${searchQuery}"` : ""}${filters.status ? ` (Status: ${filters.status})` : ""}${filters.category ? ` (Category: ${filters.category})` : ""}.`
    : `Showing all ${totalResults} read-later items.`;

  // Loading and error states (existing, with search/filter UX)
  if (loading) 
    return <div className="flex justify-center py-10 text-gray-400 text-lg">Loading read-later items...</div>;
  if (error) 
    return <div className="flex justify-center py-10 text-red-500">Error: {error}</div>;
  if (!readLaterContent.length) 
    return (
      <div className="flex justify-center py-10 text-gray-400">
        {hasSearch || hasFilters ? "No read-later content matches your search or filters." : "No read-later items yet."}
      </div>
    );

  return (
    <>
      {/* NEW: Results summary (above grid, now includes filters) */}
      <div className="mb-4 text-center text-gray-400 text-sm">
        {resultsText}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-[2px] gap-y-[-10px] place-items-center">
        {readLaterContent.map((card) => {
          const contentType = card.content_type as "post" | "mindmap" | "research";

          return (
            <div key={card.id} style={{ width: "360px", transform: "scale(0.9)", transformOrigin: "top center" }}>
              <ReadlaterCard
                {...card}
                authorEmail={card.authorEmail || ""}
                type={contentType}
                onDelete={() => handleDelete(card.id, contentType)}
                onRemoveFromReadlater={async () => {
                  const readLaterItem = readLater.find((r) => r.content_id === card.id);
                  if (!readLaterItem) return;
                  try {
                    const res = await fetch(`/api/read-later/${readLaterItem.id}`, {
                      method: "DELETE",
                      headers: { Authorization: `Bearer ${token}` },
                    });
                    if (!res.ok) throw new Error("Failed to remove from read-later");
                    await refetchReadLater();
                  } catch (err) {
                    console.error(err);
                    alert("Failed to remove from read-later");
                  }
                }}
                // NEW: Pass onOpenComments for comment functionality
                onOpenComments={() => handleOpenComments(card)}
                onOpenContent={() => handleOpenContentPopup(card)} // ✅ pass this
              />
            </div>
          );
        })}
      </div>

      {/* NEW: Comments Popup (same as BookmarksGrid) */}
      {isPopupOpen && selectedContent && (
        <CommentsPopup
                          id={selectedContent.id}
                          title={selectedContent.title}
                          content_body={
                            "content_body" in selectedContent
                              ? selectedContent.content_body || ""
                              : ""
                          }
                          comments={comments}
                         
                          onClose={() => setIsPopupOpen(false)}
                          onAddComment={handleAddComment}
        />
      )}

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
