"use client";

import { useState, useMemo, useEffect } from "react";
import BookmarkCard from "./BookmarkCard";
import CommentsPopup from "./CommentsPopup";
import { useBookmarksAndReadLater } from "@/hooks/useBookmarksAndReadLater";
import { useContent } from "@/hooks/useContent";
import { useAuthContext } from "@/hooks/AuthProvider";
import { CONTENT_TYPES } from "@/lib/enums";
import { AnyContent, Comment } from "@/types/content";
import ContentPopup from "./ContentPopup";
import SharePopup from "./SharePopup";
import ContentCardSkeleton from "./ContentCardSkeleton";
import DeleteConfirmPopup from "./DeleteConfirmPopup";

interface BookmarksGridProps {
  searchQuery?: string;
  filters?: {
    status?: string;
    category?: string;
    selectedContentId?: string | null;
  };
  selectedContentId?: string | null;
}

export default function BookmarksGrid({
  searchQuery = "",
  filters = {},
  selectedContentId,
}: BookmarksGridProps) {
  const { bookmarks, loading, error, refetchBookmarks } =
    useBookmarksAndReadLater({ autoFetch: true });
  const { data: allContent = [], refetch } = useContent({
    type: "all",
    autoFetch: true,
  });
  const { user } = useAuthContext(); // ✅ updated to use AuthContext

  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [selectedContent, setSelectedContent] = useState<AnyContent | null>(
    null
  );
  const [deletePopup, setDeletePopup] = useState<{ id: string; type: CONTENT_TYPES; title: string } | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [selectedContentPopup, setSelectedContentPopup] =
    useState<AnyContent | null>(null);
  const [selectedShareData, setSelectedShareData] = useState<{
    id: string;
    title: string;
    type: "post" | "mindmap" | "research";
  } | null>(null);

  const token =
    typeof window !== "undefined"
      ? localStorage.getItem("token") || undefined
      : undefined;

//new part 
  const [commentCounts, setCommentCounts] = useState<Record<string, number>>({});
 
  useEffect(() => {
  if (bookmarks.length === 0) return;

  const contentIds = bookmarks.map((c) => c.id).join(",");

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
  }, [bookmarks]);

/** Fetch vote */
const [voteCounts, setVoteCounts] = useState<Record<string, { likes: number; dislikes: number }>>({});

  // Fetch vote counts for all cards
  const fetchVoteCounts = async () => {
    if (bookmarks.length === 0) return;

    const contentIds = bookmarks.map((c) => c.id).join(",");

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
  }, [bookmarks]);

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


  // Merge bookmarks with content
  const bookmarkedContent = useMemo(() => {
    const matched = bookmarks
      .map((b) => allContent.find((c) => c.id === b.content_id))
      .filter(Boolean) as AnyContent[];

    let filtered = matched;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter((item) =>
        item.title?.toLowerCase().includes(q)
      );
    }

    if (filters.status) filtered = filtered.filter((i) => i.status === filters.status);
    if (filters.category)
      filtered = filtered.filter(
        (i) => i.category_id === filters.category || i.categoryName === filters.category
      );

    return filtered;
  }, [bookmarks, allContent, searchQuery, filters]);

  // Comments logic
  const fetchComments = async (contentId: string) => {
    try {
      const res = await fetch(`/api/comments?content_id=${contentId}`);
      const json = await res.json();
      setComments(json.success ? json.comments || [] : []);
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

  // Delete content
  const getApiPath = (type: CONTENT_TYPES) => {
    switch (type) {
      case CONTENT_TYPES.POST: return "posts";
      case CONTENT_TYPES.MINDMAP: return "mindmaps";
      case CONTENT_TYPES.RESEARCH: return "research";
      default: return "content";
    }
  };

  const handleDelete = async (contentId: string, contentType: CONTENT_TYPES) => {
  if (!token) return alert("You must be logged in to delete content.");

  try {
    // 🟣 1️⃣ Remove from bookmarks first
    const bookmark = bookmarks.find((b) => b.content_id === contentId);
    if (bookmark?.id) {
      const bookmarkRes = await fetch(`/api/bookmarks/${bookmark.id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!bookmarkRes.ok) {
        console.warn("Failed to remove bookmark before content deletion");
      }
    }

    // 🟢 2️⃣ Delete the content itself
    const contentRes = await fetch(
      `/api/content/${getApiPath(contentType)}/${contentId}`,
      {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    if (!contentRes.ok) throw new Error("Failed to delete content");

    // 🟡 3️⃣ Refresh UI after both are done
    await refetch();
    await refetchBookmarks();
  } catch (err) {
    console.error("Delete error:", err);
    alert("Failed to delete item.");
  }
};

  // Auto-open content popup if selectedContentId provided
  useEffect(() => {
    if (selectedContentId && allContent.length > 0) {
      const content = allContent.find((item) => item.id === selectedContentId);
      if (content) setSelectedContentPopup(content);
    }
  }, [selectedContentId, allContent]);

  if (error) return <div className="flex justify-center py-10 text-red-500">Error: {error}</div>;
  if (!bookmarkedContent.length) return <div className="flex justify-center py-10 text-gray-400 text-sm">No bookmarks yet.</div>;

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-[2px] gap-y-[-10px] place-items-center">
        {loading
          ? Array(8).fill(0).map((_, i) => (
              <div key={i} style={{ width: "360px", transform: "scale(0.9)", transformOrigin: "top center" }}>
                <ContentCardSkeleton />
              </div>
            ))
          : bookmarkedContent.map((card) => {
              const contentType = card.content_type as CONTENT_TYPES;
              return (
                <div key={card.id} style={{ width: "360px", transform: "scale(0.9)", transformOrigin: "top center" }}>
                  <BookmarkCard
                    {...card}
                    authorEmail={card.authorEmail || ""}
                    type={contentType}
                    onDelete={() => setDeletePopup({ id: card.id, type: contentType,title:card.title })}
                    onRemoveFromBookmark={async () => {
                      const bookmark = bookmarks.find((b) => b.content_id === card.id);
                      if (!bookmark) return;
                      try {
                        const res = await fetch(`/api/bookmarks/${bookmark.id}`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } });
                        if (!res.ok) throw new Error("Failed to remove bookmark");
                        await refetchBookmarks();
                      } catch (err) {
                        console.error("Remove bookmark error:", err);
                        alert("Failed to remove bookmark");
                      }
                    }}
                    onOpenComments={() => handleOpenComments(card)}
                    onOpenContent={() => setSelectedContentPopup(card)}
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

      {isPopupOpen && selectedContent && (
        <CommentsPopup
          id={selectedContent.id}
          title={selectedContent.title}
          content_body={"content_body" in selectedContent ? selectedContent.content_body || "" : ""}
          comments={comments}
          onClose={() => setIsPopupOpen(false)}
          onAddComment={handleAddComment}
          excalidraw_data={selectedContent.excalidraw_data}
        />
      )}

      {selectedContentPopup && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[9999] flex justify-center items-center">
          <div className="relative w-[80%] max-w-[800px] max-h-[85vh] overflow-y-auto bg-[#1a1a1a] rounded-2xl border border-white/10 shadow-lg p-6">
            <button onClick={() => setSelectedContentPopup(null)} className="absolute top-4 right-4 text-gray-400 hover:text-white text-2xl">✕</button>
            <ContentPopup
              id={selectedContentPopup.id}
              title={selectedContentPopup.title}
              content_body={"content_body" in selectedContentPopup ? selectedContentPopup.content_body || "" : ""}
              onClose={() => setSelectedContentPopup(null)}
              created_at={selectedContentPopup.created_at}
              updated_at={selectedContentPopup.updated_at}
              status={selectedContentPopup.status}
              excalidraw_data={selectedContentPopup.excalidraw_data}
              categoryName={typeof selectedContentPopup.categoryName === "string" ? [selectedContentPopup.categoryName] : selectedContentPopup.categoryName}
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
