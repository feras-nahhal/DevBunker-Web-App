"use client";

import { useState } from "react";
import ContentCard from "./ContentCard";
import CommentsPopup from "./CommentsPopup";
import { useContent } from "@/hooks/useContent";
import { useAuth } from "@/hooks/useAuth";

interface ContentGridProps {
  type?: "all" | "post" | "research" | "mindmap";
}

export default function ContentGrid({ type = "all" }: ContentGridProps) {
  const { data, loading, error, refetch } = useContent({ type });
  const { user } = useAuth();

  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [selectedContent, setSelectedContent] = useState<any>(null);
  const [comments, setComments] = useState<any[]>([]);

  const token =
    typeof window !== "undefined"
      ? localStorage.getItem("token") || undefined
      : undefined;

  // ✅ Fetch comments for a content item
  const fetchComments = async (contentId: string) => {
    try {
      const res = await fetch(`/api/comments?content_id=${contentId}`);
      if (!res.ok) throw new Error("Failed to fetch comments");
      const data = await res.json();
      if (data.success) setComments(data.comments || []);
      else throw new Error(data.error || "Unknown error");
    } catch (err) {
      console.error("Error fetching comments:", err);
      setComments([]);
    }
  };

  // ✅ Open comments popup
  const handleOpenComments = async (content: any) => {
    setSelectedContent(content);
    await fetchComments(content.id);
    setIsPopupOpen(true);
  };

  // ✅ Add a comment or reply
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
          content_id: selectedContent.id,
          text,
          parent_id: parentId || null,
        }),
      });

      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      await fetchComments(selectedContent.id); // Refresh comments
    } catch (err) {
      console.error("Failed to post comment:", err);
      alert("Failed to post comment.");
    }
  };

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
        No {type === "all" ? "content" : type} available.
      </div>
    );

  // ✅ Render content grid
  return (
    <>
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
          content_body={selectedContent.content_body}
          comments={comments}
          onClose={() => setIsPopupOpen(false)}
          onAddComment={handleAddComment}
        />
      )}
    </>
  );
}
