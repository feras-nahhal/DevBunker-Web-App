"use client";

import { useState, useEffect, useMemo } from "react";
import ContentCard from "./ContentCard";
import CommentsPopup from "./CommentsPopup";
import { useContent } from "@/hooks/useContent";
import { useAuth } from "@/hooks/useAuth";
import { CONTENT_STATUS, CONTENT_TYPES } from "@/lib/enums";
import { AnyContent, Comment } from "@/types/content";

interface ContentGridProps {
  type?: "all" | "post" | "research" | "mindmap";
}

export default function ContentGrid({ type = "all" }: ContentGridProps) {
  const { data = [], loading, error, refetch } = useContent({ type });
  const { user } = useAuth();

  // Filters
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");

  // Selection + Pagination
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);

  // Comments
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [selectedContent, setSelectedContent] = useState<AnyContent | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);

  const token =
    typeof window !== "undefined"
      ? localStorage.getItem("token") || undefined
      : undefined;

  /** 🧠 Client-side filtering */
  const filteredData = useMemo(() => {
    let filtered = [...data];

    if (search.trim()) {
      const q = search.toLowerCase();
      filtered = filtered.filter(
        (item) =>
          item.title?.toLowerCase().includes(q) ||
          ("content_body" in item &&
            item.content_body?.toLowerCase().includes(q))
      );
    }

    if (statusFilter)
      filtered = filtered.filter((i) => i.status === statusFilter);

    if (categoryFilter.trim()) {
      const q = categoryFilter.toLowerCase();
      filtered = filtered.filter((i) =>
        (i.categoryName || i.category_id || "")
          .toString()
          .toLowerCase()
          .includes(q)
      );
    }

    return filtered;
  }, [data, search, statusFilter, categoryFilter]);

  /** Pagination */
  const totalPages = Math.max(1, Math.ceil(filteredData.length / itemsPerPage));
  const paginatedData = useMemo(
    () =>
      filteredData.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
      ),
    [filteredData, currentPage, itemsPerPage]
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [search, statusFilter, categoryFilter]);

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
    }
  };

  /** 🗑 Delete logic */
  const getApiPath = (t: CONTENT_TYPES) => {
    switch (t) {
      case CONTENT_TYPES.POST:
        return "posts";
      case CONTENT_TYPES.RESEARCH:
        return "research";
      case CONTENT_TYPES.MINDMAP:
        return "mindmaps";
      default:
        return "content";
    }
  };

  const handleDelete = async (id: string, type: CONTENT_TYPES) => {
    if (!token) return alert("You must be logged in to delete content.");
    try {
      const res = await fetch(`/api/content/${getApiPath(type)}/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!res.ok) throw new Error();
      await refetch();
      setSelectedIds((prev) => prev.filter((s) => s !== id));
    } catch {
      alert("Failed to delete item.");
    }
  };

  const handleDeleteSelected = async () => {
    if (!token) return alert("You must be logged in to delete content.");
    if (!selectedIds.length) return;

    try {
      await Promise.all(
        selectedIds.map(async (id) => {
          const item = filteredData.find((d) => d.id === id);
          if (!item) return;
          await fetch(`/api/content/${getApiPath(item.content_type)}/${id}`, {
            method: "DELETE",
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });
        })
      );
      await refetch();
      setSelectedIds([]);
    } catch {
      alert("Error deleting selected items.");
    }
  };

  /** Selection */
  const handleSelect = (id: string, checked: boolean) =>
    setSelectedIds((prev) =>
      checked ? [...new Set([...prev, id])] : prev.filter((s) => s !== id)
    );

  const selectAll = () =>
    setSelectedIds(
      selectedIds.length === filteredData.length ? [] : filteredData.map((c) => c.id)
    );

  /** Pagination Controls */
  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages) setCurrentPage(page);
  };

  /** 🌀 Render */
  if (loading)
    return (
      <div className="flex justify-center py-10 text-gray-400 text-lg">
        Loading...
      </div>
    );

  if (error)
    return (
      <div className="flex justify-center py-10 text-red-500">
        Error: {error}
      </div>
    );

  return (
    <>
      <div
        className="flex flex-col items-center justify-start mx-auto"
        style={{
          width: "1200px",
          backgroundColor: "rgba(255,255,255,0.05)",
          borderRadius: "10px",
          border: "1px solid rgba(80,80,80,0.24)",
          boxShadow: "inset 0 0 7px rgba(255,255,255,0.16)",
          backdropFilter: "blur(12px)",
          overflow: "hidden",
        }}
      >
        {/* 🧠 Stats Summary */}
        <div className="flex flex-wrap gap-4 w-full px-5 py-4 border-b border-[rgba(145,158,171,0.2)] bg-white/[0.05]">
          {[
            { label: "All", color: "#9CA3AF", count: filteredData.length },
            { label: "Published", color: "rgba(34,197,94,0.16)", count: filteredData.filter((i) => i.status === "published").length },
            { label: "Pending", color: "rgba(255,171,0,0.16)", count: filteredData.filter((i) => i.status === "pending_approval").length },
            { label: "Rejected", color: "rgba(255,86,48,0.16)", count: filteredData.filter((i) => i.status === "rejected").length },
          ].map((item) => (
            <div key={item.label} className="flex items-center gap-2">
              <span className="text-white text-sm capitalize">{item.label}</span>
              <div
                className="w-6 h-6 flex items-center justify-center rounded-md text-white text-xs font-semibold shadow-sm"
                style={{
                  backgroundColor: item.color,
                  boxShadow: `0 0 6px ${item.color}80`,
                }}
              >
                {item.count}
              </div>
            </div>
          ))}
        </div>

        {/* 🔍 Search & Filters */}
        <div className="w-full border-b border-[rgba(145,158,171,0.2)] bg-white/[0.05] px-5 py-4">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="🔍 Search..."
            className="w-full px-4 py-2 text-sm text-white bg-white/[0.08] border border-white/[0.15] rounded-md focus:outline-none focus:ring-1 focus:ring-white/[0.25] placeholder:text-gray-400 mb-3"
          />
          <div className="flex items-center gap-3">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 text-sm text-white bg-white/[0.08] border border-dashed border-[rgba(145,158,171,0.2)] rounded-md focus:ring-1 focus:ring-white/[0.25]"
            >
              <option value="">All</option>
              {Object.values(CONTENT_STATUS).map((s) => (
                <option key={s} value={s} className="bg-[#1a1a1a] text-white">
                  {s.replace("_", " ").toUpperCase()}
                </option>
              ))}
            </select>

            <input
              type="text"
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              placeholder="Category"
              className="px-3 py-2 w-[200px] text-sm text-white bg-white/[0.08] border border-dashed border-[rgba(145,158,171,0.2)] rounded-md focus:ring-1 focus:ring-white/[0.25] placeholder:text-gray-400"
            />
          </div>
        </div>

        {/* 🧾 Content Cards */}
        <div className="flex flex-col w-full min-h-[200px] justify-center items-center">
          {filteredData.length === 0 ? (
            <div className="text-gray-400 py-10 text-center text-sm">
              No {type} content found.
            </div>
          ) : (
            paginatedData.map((card) => (
              <ContentCard
                key={card.id}
                {...card}
                type={card.content_type as "post" | "research" | "mindmap"}
                isSelected={selectedIds.includes(card.id)}
                onSelect={handleSelect}
                onDelete={() => handleDelete(card.id, card.content_type)}
                onOpenComments={() => handleOpenComments(card)}
              />
            ))
          )}
        </div>

        {/* 🔢 Footer + Pagination */}
        <div className="flex items-center justify-between w-full border-t border-[rgba(145,158,171,0.2)] py-3 px-5 bg-white/[0.05]">
          <div className="flex items-center gap-3">
            <span className="text-white text-[12px] opacity-80">
              {selectedIds.length} row{selectedIds.length !== 1 ? "s" : ""} selected
            </span>
            {selectedIds.length > 0 && (
              <>
                <button
                  onClick={handleDeleteSelected}
                  className="px-3 py-1 bg-red-500/80 hover:bg-red-600 text-white text-[12px] rounded-md transition-all"
                >
                  🗑 Delete Selected
                </button>
                <button
                  onClick={() => setSelectedIds([])}
                  className="px-3 py-1 bg-gray-500/50 hover:bg-gray-600 text-white text-[12px] rounded-md transition-all"
                >
                  ❌ Unselect All
                </button>
              </>
            )}
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="text-[12px] text-gray-300">Rows per page:</span>
              <input
                type="number"
                min={1}
                value={itemsPerPage}
                onChange={(e) => {
                  const val = Math.max(1, Number(e.target.value) || 1);
                  setItemsPerPage(val);
                  setCurrentPage(1);
                }}
                className="bg-white/[0.1] text-white text-[12px] px-2 py-1 w-14 rounded-md outline-none hover:bg-white/[0.2] transition-all text-center"
              />
            </div>

            <span className="text-white text-[12px]">
              Page {Math.min(currentPage, totalPages)} of {totalPages}
            </span>

            <div className="flex items-center gap-2">
              <button
                onClick={() => goToPage(1)}
                disabled={currentPage === 1}
                className={`w-8 h-8 rounded-md text-white ${
                  currentPage === 1
                    ? "bg-gray-600 cursor-not-allowed"
                    : "bg-white/[0.1] hover:bg-white/[0.2]"
                }`}
              >
                &lt;&lt;
              </button>
              <button
                onClick={() => goToPage(currentPage - 1)}
                disabled={currentPage === 1}
                className={`w-8 h-8 rounded-md text-white ${
                  currentPage === 1
                    ? "bg-gray-600 cursor-not-allowed"
                    : "bg-white/[0.1] hover:bg-white/[0.2]"
                }`}
              >
                &lt;
              </button>
              <button
                onClick={() => goToPage(currentPage + 1)}
                disabled={currentPage === totalPages}
                className={`w-8 h-8 rounded-md text-white ${
                  currentPage === totalPages
                    ? "bg-gray-600 cursor-not-allowed"
                    : "bg-white/[0.1] hover:bg-white/[0.2]"
                }`}
              >
                &gt;
              </button>
              <button
                onClick={() => goToPage(totalPages)}
                disabled={currentPage === totalPages}
                className={`w-8 h-8 rounded-md text-white ${
                  currentPage === totalPages
                    ? "bg-gray-600 cursor-not-allowed"
                    : "bg-white/[0.1] hover:bg-white/[0.2]"
                }`}
              >
                &gt;&gt;
              </button>
            </div>
          </div>
        </div>
      </div>

      {isPopupOpen && selectedContent && (
        <CommentsPopup
          id={selectedContent.id}
          title={selectedContent.title}
          content_body={"content_body" in selectedContent ? selectedContent.content_body || "" : ""}
          comments={comments}
          tags={(selectedContent as any).tags || []}
          onClose={() => setIsPopupOpen(false)}
          onAddComment={handleAddComment}
        />
      )}
    </>
  );
}
