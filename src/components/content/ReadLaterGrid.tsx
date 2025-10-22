"use client";

import { useEffect, useState } from "react";
import ReadlaterCard from "./ReadlaterCard";
import CommentsPopup from "./CommentsPopup";
import { useBookmarksAndReadLater } from "@/hooks/useBookmarksAndReadLater";
import { useContent } from "@/hooks/useContent";
import { AnyContent, Comment } from "@/types/content";
import ContentPopup from "./ContentPopup";
import SharePopup from "./SharePopup";
import ContentCardSkeleton from "./ContentCardSkeleton";
import { useAuthContext } from "@/hooks/AuthProvider";

interface ReadLaterGridProps {
  searchQuery?: string;
  filters?: Record<string, string>;
  selectedContentId?: string | null;
}

export default function ReadLaterGrid({
  searchQuery = "",
  selectedContentId,
  filters = {},
}: ReadLaterGridProps) {
  const { readLater, loading, error, refetchReadLater } = useBookmarksAndReadLater({
    autoFetch: true,
  });
  const { data: allContent, refetch } = useContent({ type: "all", autoFetch: true });
  const { user} = useAuthContext();

  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [selectedContent, setSelectedContent] = useState<AnyContent | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [selectedContentPopup, setSelectedContentPopup] = useState<AnyContent | null>(null);
  const [selectedShareData, setSelectedShareData] = useState<{
    id: string;
    title: string;
    type: "post" | "mindmap" | "research";
  } | null>(null);

  const handleOpenContentPopup = (content: AnyContent) => {
    setSelectedContentPopup(content);
  };

  const token =
    typeof window !== "undefined"
      ? localStorage.getItem("token") || undefined
      : undefined;

  // 🧠 Match "Read Later" content with actual content data
  let readLaterContent = readLater
    .map((r) => allContent.find((c) => c.id === r.content_id))
    .filter(Boolean) as typeof allContent;

  // 🔍 Search
  if (searchQuery.trim()) {
    readLaterContent = readLaterContent.filter((item) =>
      item.title.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }

  // 🧩 Filters
  if (filters.status) {
    readLaterContent = readLaterContent.filter((item) => item.status === filters.status);
  }
  if (filters.category) {
    readLaterContent = readLaterContent.filter(
      (item) => item.category_id === filters.category
    );
  }

  /** 💬 Comments handling **/
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
      case "post":
        return "posts";
      case "mindmap":
        return "mindmaps";
      case "research":
        return "research";
    }
  };

  const handleDelete = async (
    contentId: string,
    contentType: "post" | "mindmap" | "research"
  ) => {
    if (!token) {
      alert("You must be logged in to delete content.");
      return;
    }
    try {
      const apiPath = getApiPath(contentType);
      const res = await fetch(`/api/content/${apiPath}/${contentId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to delete content");

      const readLaterItem = readLater.find((r) => r.content_id === contentId);
      if (readLaterItem) {
        await fetch(`/api/read-later/${readLaterItem.id}`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        });
      }

      await refetch();
      await refetchReadLater();
    } catch (err) {
      console.error(err);
      alert("Failed to delete item.");
    }
  };

  // 🔗 Open popup from query param (selectedContentId)
  useEffect(() => {
    if (selectedContentId && allContent.length > 0) {
      const content = allContent.find((item) => item.id === selectedContentId);
      if (content) {
        setSelectedContentPopup(content);
      }
    }
  }, [selectedContentId, allContent]);

  // 🧾 Summary text
  const totalResults = readLaterContent.length;
  const hasSearch = !!searchQuery.trim();
  const hasFilters = !!(filters.status || filters.category);
  const resultsText =
    hasSearch || hasFilters
      ? `Showing ${totalResults} read-later items${
          hasSearch ? ` for "${searchQuery}"` : ""
        }${filters.status ? ` (Status: ${filters.status})` : ""}${
          filters.category ? ` (Category: ${filters.category})` : ""
        }.`
      : `Showing all ${totalResults} read-later items.`;
const isLoading = loading || !allContent.length;
  // 🌀 Loading / Error states
  
  if (error)
    return (
      <div className="flex justify-center py-10 text-red-500">
        Error: {error}
      </div>
    );
  if (!readLaterContent.length)
    return (
      <div className="flex justify-center py-10 text-gray-400">
        {hasSearch || hasFilters
          ? "No read-later content matches your search or filters."
          : "No read-later items yet."}
      </div>
    );

  return (
    <>
      {/* 📚 Read Later Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-[2px] gap-y-[-10px] place-items-center">
        {loading
          ? // 🔹 Show skeletons while loading
            Array(8)
              .fill(0)
              .map((_, i) => (
                <div
                  key={i}
                  style={{
                    width: "310px",
                    transform: "scale(0.9)",
                    transformOrigin: "top center",
                  }}
                >
                  <ContentCardSkeleton />
                </div>
              ))
          : readLaterContent.length === 0
          ? // 🔹 Show empty state if no read-later items
            <div className="col-span-full text-center py-10 text-gray-400">
              You have no items in your Read Later list.
            </div>
          : // 🔹 Show actual ReadlaterCard items
            readLaterContent.map((card) => {
              const contentType = card.content_type as "post" | "mindmap" | "research";

              return (
                <div
                  key={card.id}
                  style={{
                    width: "360px",
                    transform: "scale(0.9)",
                    transformOrigin: "top center",
                  }}
                >
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
                    onOpenComments={() => handleOpenComments(card)}
                    onOpenContent={() => handleOpenContentPopup(card)}
                    onOpenShare={(data) => setSelectedShareData(data)}
                  />
                </div>
              );
            })}
      </div>


      {/* 💬 Comments Popup */}
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

      {/* 🔗 Share Popup */}
      {selectedShareData && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[9999] flex justify-center items-center">
          <SharePopup
            shareUrl={`${
              typeof window !== "undefined" ? window.location.origin : ""
            }/dashboard/explore?id=${selectedShareData.id}`}
            title={selectedShareData.title}
            type={selectedShareData.type}
            onClose={() => setSelectedShareData(null)}
          />
        </div>
      )}
    </>
  );
}
