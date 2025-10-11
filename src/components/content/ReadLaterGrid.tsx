"use client";

import ReadlaterCard from "./ReadlaterCard";
import { useBookmarksAndReadLater } from "@/hooks/useBookmarksAndReadLater";
import { useContent } from "@/hooks/useContent";

export default function ReadLaterGrid() {
  const { readLater, loading, error, refetchReadLater } = useBookmarksAndReadLater({ autoFetch: true });
  const { data: allContent, refetch } = useContent({ type: "all", autoFetch: true });

  const readLaterContent = readLater
    .map((r) => allContent.find((c) => c.id === r.content_id))
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

      const readLaterItem = readLater.find((r) => r.content_id === contentId);
      if (readLaterItem) {
        await fetch(`/api/read-later/${readLaterItem.id}`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } });
      }

      await refetch();
      await refetchReadLater();
    } catch (err) {
      console.error(err);
      alert("Failed to delete item.");
    }
  };

  if (loading) return <div className="flex justify-center py-10 text-gray-400 text-lg">Loading read-later items...</div>;
  if (error) return <div className="flex justify-center py-10 text-red-500">Error: {error}</div>;
  if (!readLaterContent.length) return <div className="flex justify-center py-10 text-gray-400">No read-later items yet.</div>;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-[2px] gap-y-[-10px] place-items-center">
      {readLaterContent.map((card) => (
        <div key={card.id} style={{ width: "360px", transform: "scale(0.9)", transformOrigin: "top center" }}>
          <ReadlaterCard
            {...card}
            authorEmail={card.authorEmail || ""}
            type={card.content_type as "post" | "mindmap" | "research"}
            onDelete={() => handleDelete(card.id, card.content_type as "post" | "mindmap" | "research")}
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
          />
        </div>
      ))}
    </div>
  );
}
