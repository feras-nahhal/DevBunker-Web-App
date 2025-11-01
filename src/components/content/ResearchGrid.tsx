"use client";

import { useEffect, useState } from "react";
import CommentsPopup from "./CommentsPopup";
import { useContent } from "@/hooks/useContent";
import ResearchCard from "./ResearchCard";
import { AnyContent, Comment } from "@/types/content";
import ContentPopup from "./ContentPopup";
import SharePopup from "./SharePopup";
import ContentCardSkeleton from "./ContentCardSkeleton";
import { useAuthContext } from "@/hooks/AuthProvider";
import DeleteConfirmPopup from "./DeleteConfirmPopup";

interface ResearchGridProps {
  type?: "all" | "post" | "research" | "mindmap";
  searchQuery?: string;
  filters?: Record<string, string>;
  selectedContentId?: string | null;  // NEW: For opening popup from URL
}

export default function ResearchGrid({
  type = "all",
  searchQuery = "",
  filters = {},
  selectedContentId,
}: ResearchGridProps) {
  const { data, loading, error, refetch } = useContent({ type, filters });
  const { user} = useAuthContext();
  

  // 🟣 State for popups
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [selectedContent, setSelectedContent] = useState<AnyContent | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [selectedContentPopup, setSelectedContentPopup] = useState<AnyContent | null>(null);

  const [selectedShareData, setSelectedShareData] = useState<{ id: string; title: string; type: "post" | "mindmap" | "research" } | null>(null);

  const [deletePopup, setDeletePopup] = useState<{
    id: string;
    type: "post" | "mindmap" | "research";
    title: string;
  } | null>(null);

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

  //new part 
  const [commentCounts, setCommentCounts] = useState<Record<string, number>>({});
 
  useEffect(() => {
  if (data.length === 0) return;

  const contentIds = data.map((c) => c.id).join(",");

  fetch(`/api/comments/counts?content_ids=${contentIds}`)
    .then((res) => res.json())
    .then((json) => {
      if (json.success) setCommentCounts(json.counts);
      else setCommentCounts({});
    })
    .catch((err) => {
      console.error("Failed to fetch comment counts:", err);
      setCommentCounts({});
    });
  }, [data]);

/** Fetch vote */
const [voteCounts, setVoteCounts] = useState<Record<string, { likes: number; dislikes: number }>>({});

  // Fetch vote counts for all cards
  const fetchVoteCounts = async () => {
    if (data.length === 0) return;

    const contentIds = data.map((c) => c.id).join(",");

    try {
      const res = await fetch(`/api/vote/counts?content_ids=${contentIds}`);
      const json = await res.json();
      if (json.success) setVoteCounts(json.counts);
      else setVoteCounts({});
    } catch (err) {
      console.error("Failed to fetch vote counts:", err);
      setVoteCounts({});
    }
  };

  useEffect(() => {
    fetchVoteCounts();
  }, [data]);

  // Handle voting: Post vote, then refetch counts for all cards
  const handleVote = async (contentId: string, voteType: "like" | "dislike") => {
    if (!token) {
      alert("You must be logged in to vote.");
      return;
    }

    try {
      const res = await fetch(`/api/vote`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ content_id: contentId, vote_type: voteType }),
      });

      if (!res.ok) throw new Error(`Vote failed: ${res.status}`);

      // Refetch counts for all cards to update the grid
      await fetchVoteCounts();
    } catch (err) {
      console.error("Vote error:", err);
      alert("Failed to vote. Please try again.");
    }
  };


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

    // ✅ Update the comments popup
    await fetchComments(selectedContent!.id);

    // ✅ Update the comment count for the card
    setCommentCounts((prev) => ({
      ...prev,
      [selectedContent!.id]: (prev[selectedContent!.id] || 0) + 1,
    }));

  } catch (err) {
    console.error("Failed to post comment:", err);
    const message = err instanceof Error ? err.message : "Failed to post comment.";
    alert(message);
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

  // NEW: Open popup if selectedContentId matches
    useEffect(() => {
      if (selectedContentId && data.length > 0) {
        const content = data.find((item) => item.id === selectedContentId);
        if (content) {
          setSelectedContentPopup(content);
        }
      }
    }, [selectedContentId, data]);

  /** 🧭 Results text */
  const totalResults = filteredData.length;
  const hasSearch = !!searchQuery.trim();
  const hasFilters = !!(filters.status || filters.category);
  const resultsText =
    hasSearch || hasFilters
      ? `Showing ${totalResults} of your results${hasSearch ? ` for "${searchQuery}"` : ""}${filters.status ? ` (Status: ${filters.status})` : ""}${filters.category ? ` (Category ID: ${filters.category})` : ""}.`
      : `Showing all ${totalResults} of your items.`;

  /** 🌀 Loading / error / empty states */
 
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
        {loading
                    ? Array(8).fill(0).map((_, i) => (
                        <div key={i} style={{ width: "310px", transform: "scale(0.9)", transformOrigin: "top center" }}>
                          <ContentCardSkeleton />
                        </div>
                      ))
                    : filteredData.map((card) => {
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
              <ResearchCard
                {...card}
                type={contentType}
                status={card.status}
                 onDelete={() =>
                      setDeletePopup({
                        id: card.id,
                        type: card.content_type as "post" | "mindmap" | "research",
                        title: card.title,
                      })
                    }
                onOpenComments={() => handleOpenComments(card)}
                onOpenContent={() => handleOpenContentPopup(card)}
                onOpenShare={(data) => setSelectedShareData(data)}
                commentCount={commentCounts[card.id] || 0}// ✅ pass count
                likes={voteCounts[card.id]?.likes || 0} // Pass from grid's state
                dislikes={voteCounts[card.id]?.dislikes || 0} // Pass from grid's state
                onVote={(voteType) => handleVote(card.id, voteType)} // Pass vote handler
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

      {selectedShareData && (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[9999] flex justify-center items-center">
              <SharePopup
                shareUrl={`${typeof window !== "undefined" ? window.location.origin : ""}/dashboard/explore?id=${selectedShareData.id}`}
                title={selectedShareData.title}
                type={selectedShareData.type}
                onClose={() => setSelectedShareData(null)}
              />
            </div>
          )}

          {deletePopup && (
                  <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[9999] flex justify-center items-center">
                    <DeleteConfirmPopup
                      title={deletePopup.title}
                      type={deletePopup.type}
                      onConfirm={async () => {
                        await handleDelete(deletePopup.id, deletePopup.type);
                        // ❌ remove setDeletePopup(null) here — popup now closes inside itself
                      }}
                      onClose={() => setDeletePopup(null)}
                    />
                  </div>
                )}
    </>
  );
}
