"use client";

import { useState } from "react";
import CommentsPopup from "./CommentsPopup";
import { useContent } from "@/hooks/useContent";
import { useAuth } from "@/hooks/useAuth";
import ContentCard1 from "./ContentCard1";
import { AnyContent, Comment } from "@/types/content";
import ContentPopup from "./ContentPopup";

interface ContentGrid1Props {
  type?: "all" | "post" | "research" | "mindmap";
  searchQuery?: string;
  filters?: Record<string, string>;
}

export default function ContentGrid1({
  type = "all",
  searchQuery = "",
  filters = {},
}: ContentGrid1Props) {
  const { data, loading, error, refetch } = useContent({ type, filters });
  const { user } = useAuth();
  

  // 🟣 State for popups
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [selectedContent, setSelectedContent] = useState<AnyContent | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [selectedContentPopup, setSelectedContentPopup] = useState<AnyContent | null>(null);

  const handleOpenContentPopup = (content: AnyContent) => {
    setSelectedContentPopup(content);
  };

  const token =
    typeof window !== "undefined"
      ? localStorage.getItem("token") || undefined
      : undefined;

  /** ✅ Filter content to show only user's own items */
  const filteredData = user
    ? data.filter((item) => item.author_id === user.id)
    : [];

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

  /** 🗑️ Delete content */
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

  /** 🧭 Results text */
  const totalResults = filteredData.length;
  const hasSearch = !!searchQuery.trim();
  const hasFilters = !!(filters.status || filters.category);
  const resultsText =
    hasSearch || hasFilters
      ? `Showing ${totalResults} of your results${hasSearch ? ` for "${searchQuery}"` : ""}${filters.status ? ` (Status: ${filters.status})` : ""}${filters.category ? ` (Category ID: ${filters.category})` : ""}.`
      : `Showing all ${totalResults} of your items.`;

  /** 🌀 Loading / error / empty states */
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

  if (!filteredData.length)
    return (
      <div className="flex justify-center py-10 text-gray-400">
        {hasSearch || hasFilters
          ? `No ${type === "all" ? "content" : type} matches your search or filters.`
          : `You haven't created any ${type === "all" ? "content" : type} yet.`}
      </div>
    );

  /** 🧩 Render cards */
  return (
    <>
      <div className="mb-4 text-center text-gray-400 text-sm">{resultsText}</div>

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
        {filteredData.map((card) => {
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
              <ContentCard1
                {...card}
                type={contentType}
                status={card.status}
                onDelete={() => handleDelete(card.id, contentType)}
                onOpenComments={() => handleOpenComments(card)}
                onOpenContent={() => handleOpenContentPopup(card)}
              />
            </div>
          );
        })}
      </div>

      {/* 🟢 Comments Popup */}
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
