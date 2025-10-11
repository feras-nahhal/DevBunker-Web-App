"use client";

import BookmarkCard from "./BookmarkCard";
import { useBookmarksAndReadLater } from "@/hooks/useBookmarksAndReadLater";
import { useContent } from "@/hooks/useContent";

export default function BookmarksGrid() {
  const { bookmarks, loading, error, refetchBookmarks } = useBookmarksAndReadLater({ autoFetch: true });
  const { data: allContent, refetch } = useContent({ type: "all", autoFetch: true });

  const bookmarkedContent = bookmarks
    .map((b) => allContent.find((c) => c.id === b.content_id))
    .filter(Boolean) as typeof allContent;

  const token = typeof window !== "undefined" ? localStorage.getItem("token") || undefined : undefined;

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
      const res = await fetch(`/api/content/${apiPath}/${contentId}`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) throw new Error("Failed to delete content");

      const bookmark = bookmarks.find((b) => b.content_id === contentId);
      if (bookmark) {
        await fetch(`/api/bookmarks/${bookmark.id}`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } });
      }

      await refetch();
      await refetchBookmarks();
    } catch (err) {
      console.error(err);
      alert("Failed to delete item.");
    }
  };

  if (loading) return <div className="flex justify-center py-10 text-gray-400 text-lg">Loading bookmarks...</div>;
  if (error) return <div className="flex justify-center py-10 text-red-500">Error: {error}</div>;
  if (!bookmarkedContent.length) return <div className="flex justify-center py-10 text-gray-400">No bookmarks yet.</div>;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-[2px] gap-y-[-10px] place-items-center">
      {bookmarkedContent.map((card) => (
        <div key={card.id} style={{ width: "360px", transform: "scale(0.9)", transformOrigin: "top center" }}>
          <BookmarkCard
            {...card}
            authorEmail={card.authorEmail || ""}
            type={card.content_type as "post" | "mindmap" | "research"}
            onDelete={() => handleDelete(card.id, card.content_type as "post" | "mindmap" | "research")}
            onRemoveFromBookmark={async () => {
              const bookmark = bookmarks.find((b) => b.content_id === card.id);
              if (!bookmark) return;
              try {
                const res = await fetch(`/api/bookmarks/${bookmark.id}`, {
                  method: "DELETE",
                  headers: { Authorization: `Bearer ${token}` },
                });
                if (!res.ok) throw new Error("Failed to remove bookmark");
                await refetchBookmarks();
              } catch (err) {
                console.error(err);
                alert("Failed to remove bookmark");
              }
            }}
          />
        </div>
      ))}
    </div>
  );
}
