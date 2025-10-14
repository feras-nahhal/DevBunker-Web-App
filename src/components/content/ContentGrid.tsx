"use client";

import { useState } from "react";
import ContentCard from "./ContentCard";
import CommentsPopup from "./CommentsPopup";
import { useContent } from "@/hooks/useContent";
import { useAuth } from "@/hooks/useAuth";
import { AnyContent, Comment } from "@/types/content";


interface ContentGridProps {
  type?: "all" | "post" | "research" | "mindmap";
  searchQuery?: string; // Raw search for display
  filters?: Record<string, string>; // Includes q (debounced), status, category
}

export default function ContentGrid({
  type = "all",
  searchQuery = "",
  filters = {},
}: ContentGridProps) {
  const { data, loading, error, refetch } = useContent({ type, filters });
  const { user } = useAuth();

  // 👇 Replace `any` with proper types
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [selectedContent, setSelectedContent] = useState<AnyContent | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);

  const token =
    typeof window !== "undefined"
      ? localStorage.getItem("token") || undefined
      : undefined;

  /** 🧠 Fetch comments for a content item */
  const fetchComments = async (contentId: string) => {
    try {
      const res = await fetch(`/api/comments?content_id=${contentId}`);
      if (!res.ok) throw new Error("Failed to fetch comments");
      const data = await res.json();
      if (data.success) setComments(data.comments || []);
      else throw new Error(data.error || "Unknown error");
    } catch (err: unknown) {
      console.error("Error fetching comments:", err);
      setComments([]);
    }
  };

  /** 🧠 Open comments popup */
  const handleOpenComments = async (content: AnyContent) => {
    setSelectedContent(content);
    await fetchComments(content.id);
    setIsPopupOpen(true);
  };

  /** 🧠 Add a comment or reply */
  const handleAddComment = async (text: string, parentId?: string) => {
    if (!token) {
      alert("You must be logged in to comment.");
      return;
    }

    try {
      const res = await fetch(`/api/comments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          content_id: selectedContent?.id,
          text,
          parent_id: parentId || null,
        }),
      });

      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      await fetchComments(selectedContent!.id);
    } catch (err: unknown) {
      console.error("Failed to post comment:", err);
      const message =
        err instanceof Error ? err.message : "Failed to post comment.";
      alert(message);
    }
  };

  /** 🧠 Determine API path for deleting content */
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

  /** 🧠 Delete content handler */
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
    } catch (err: unknown) {
      console.error("Error deleting item:", err);
      const message =
        err instanceof Error ? err.message : "Failed to delete item.";
      alert(message);
    }
  };

  /** 🧠 Results summary text */
  const totalResults = data.length;
  const hasSearch = !!searchQuery.trim();
  const hasFilters = !!(filters.status || filters.category);
  const resultsText =
    hasSearch || hasFilters
      ? `Showing ${totalResults} results${
          hasSearch ? ` for "${searchQuery}"` : ""
        }${filters.status ? ` (Status: ${filters.status})` : ""}${
          filters.category ? ` (Category ID: ${filters.category})` : ""
        }.`
      : `Showing all ${totalResults} items.`;

  /** 🧠 Loading and error states */
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
          ? `No ${
              type === "all" ? "content" : type
            } matches your search or filters.`
          : `No ${type === "all" ? "content" : type} available.`}
      </div>
    );

  /** 🧠 Render content grid */
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
              <ContentCard
                {...card}
                type={contentType}
                onDelete={() => handleDelete(card.id, contentType)}
                onOpenComments={() => handleOpenComments(card)}
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
          tags={(selectedContent as any).tags || []}
          onClose={() => setIsPopupOpen(false)}
          onAddComment={handleAddComment}
        />
      )}
    </>
  );
}
