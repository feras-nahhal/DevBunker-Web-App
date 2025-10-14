"use client";

import { useState, useEffect, useMemo } from "react";
import ContentCard from "./ContentCard";
import CommentsPopup from "./CommentsPopup";
import { useContent } from "@/hooks/useContent";
import { useAuth } from "@/hooks/useAuth";
import { CONTENT_STATUS } from "@/lib/enums";

interface ContentGridProps {
  type?: "all" | "post" | "research" | "mindmap";
}

export default function ContentGrid({ type = "all" }: ContentGridProps) {
  const { data, loading, error, refetch } = useContent({ type });
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
  const [selectedContent, setSelectedContent] = useState<any>(null);
  const [comments, setComments] = useState<any[]>([]);

  const token =
    typeof window !== "undefined"
      ? localStorage.getItem("token") || undefined
      : undefined;

 /** 🧠 Client-side filtering (no refetch needed) */
const filteredData = useMemo(() => {
  let filtered = data || [];

  // 🔍 Search filter
  if (search.trim()) {
    const query = search.toLowerCase();
    filtered = filtered.filter(
      (item) =>
        item.title?.toLowerCase().includes(query) ||
        ('content_body' in item &&
          item.content_body?.toLowerCase().includes(query))
    );
  }

  // ⚙️ Status filter
  if (statusFilter)
    filtered = filtered.filter((item) => item.status === statusFilter);

  // 🏷 Category filter
  if (categoryFilter.trim()) {
    const query = categoryFilter.trim().toLowerCase();
    filtered = filtered.filter((item) => {
      const categoryValue = (
        typeof item.categoryName === "string"
          ? item.categoryName
          : item.categoryName || item.category_id
      )
        ?.toString()
        .trim()
        .toLowerCase();

      return categoryValue?.includes(query);
    });
  }

  return filtered;
}, [data, search, statusFilter, categoryFilter]);



  /** Pagination */
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const paginatedData = filteredData.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  useEffect(() => setCurrentPage(1), [search, statusFilter, categoryFilter]);

  /** Comments */
  const fetchComments = async (contentId: string) => {
    try {
      const res = await fetch(`/api/comments?content_id=${contentId}`);
      const json = await res.json();
      if (json.success) setComments(json.comments || []);
    } catch (err) {
      console.error("Error fetching comments:", err);
      setComments([]);
    }
  };

  const handleOpenComments = async (content: any) => {
    setSelectedContent(content);
    await fetchComments(content.id);
    setIsPopupOpen(true);
  };

  const handleAddComment = async (text: string, parentId?: string) => {
    if (!token) return alert("You must be logged in to comment.");
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

  /** Delete logic */
  const getApiPath = (t: "post" | "mindmap" | "research") =>
    t === "post" ? "posts" : t === "mindmap" ? "mindmaps" : "research";

  const handleDelete = async (id: string, t: "post" | "mindmap" | "research") => {
    if (!token) return alert("You must be logged in to delete content.");
    try {
      const res = await fetch(`/api/content/${getApiPath(t)}/${id}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
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
      for (const id of selectedIds) {
        const item = filteredData.find((d) => d.id === id);
        if (!item) continue;
        const t = item.content_type as "post" | "mindmap" | "research";
        await fetch(`/api/content/${getApiPath(t)}/${id}`, {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });
      }
      await refetch();
      setSelectedIds([]);
    } catch {
      alert("Error deleting selected items.");
    }
  };

  const handleSelect = (id: string, checked: boolean) =>
    setSelectedIds((prev) =>
      checked ? [...new Set([...prev, id])] : prev.filter((s) => s !== id)
    );

  const selectAll = () =>
    setSelectedIds(
      selectedIds.length === filteredData.length
        ? []
        : filteredData.map((c) => c.id)
    );

  /** Pagination Controls */
  const goToFirstPage = () => setCurrentPage(1);
  const goToPreviousPage = () =>
    currentPage > 1 && setCurrentPage(currentPage - 1);
  const goToNextPage = () =>
    currentPage < totalPages && setCurrentPage(currentPage + 1);
  const goToLastPage = () => setCurrentPage(totalPages);

  /** Loading/Error */
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

  /** UI */
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
                { label: "published", color: "rgba(34, 197, 94, 0.16)", count: filteredData.filter((i) => i.status === "published").length },
                { label: "Pending", color: "rgba(255, 171, 0, 0.16)", count: filteredData.filter((i) => i.status === "pending_approval").length },
                { label: "rejected", color: "rgba(255,86,48,0.16)", count: filteredData.filter((i) => i.status === "rejected").length },
            ].map((item) => (
                <div key={item.label} className="flex items-center gap-2">
                <span className="text-white text-sm">{item.label}</span>
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
  {/* 🔍 Search Bar */}
  <div className="w-full mb-3">
    <input
      type="text"
      value={search}
      onChange={(e) => setSearch(e.target.value)}
      placeholder="🔍 Search..."
      className="w-full px-4 py-2 text-sm text-white bg-white/[0.08] border border-white/[0.15] rounded-md focus:outline-none focus:ring-1 focus:ring-white/[0.25] placeholder:text-gray-400"
    />
  </div>

  {/* ⚙️ Filters */}
  <div className="flex items-center gap-3">
    {/* Status Dropdown */}
    <select
      value={statusFilter}
      onChange={(e) => setStatusFilter(e.target.value)}
      className="px-3 py-2 text-sm text-white bg-white/[0.08] border border-dashed border-[rgba(145,158,171,0.2)] rounded-md focus:outline-none focus:ring-1 focus:ring-white/[0.25] appearance-none"
      style={{
        colorScheme: "dark",
      }}
    >
      <option value="">All</option>
      {Object.values(CONTENT_STATUS).map((s) => (
        <option
          key={s}
          value={s}
          style={{
            backgroundColor: "rgba(26,26,26,0.95)", // ✅ match design
            color: "white",
          }}
        >
          {s.replace("_", " ").toUpperCase()}
        </option>
      ))}
    </select>

    {/* Category Filter */}
    <input
      type="text"
      value={categoryFilter}
      onChange={(e) => setCategoryFilter(e.target.value)}
      placeholder="Category"
      className="px-3 py-2 w-[200px] text-sm text-white bg-white/[0.08] border border-dashed border-[rgba(145,158,171,0.2)] rounded-md focus:outline-none focus:ring-1 focus:ring-white/[0.25] placeholder:text-gray-400"
    />
  </div>
</div>



        {/* Header */}
        <div
          className="relative flex flex-row items-center justify-between border-b border-[rgba(145,158,171,0.2)]"
          style={{
            width: "100%",
            height: "76px",
            padding: "16px",
          }}
        >
          <div className="relative shrink-0 ml-2">
            <input
              type="checkbox"
              checked={
                selectedIds.length === filteredData.length && filteredData.length > 0
              }
              onChange={selectAll}
              className="absolute opacity-0 w-5 h-5 cursor-pointer peer"
              id="select-all-header"
            />
            <label htmlFor="select-all-header" className="cursor-pointer">
              <div
                className={`w-5 h-5 border border-[rgba(80,80,80,0.24)] bg-white/[0.05]
                peer-checked:bg-green-500 peer-checked:border-green-500 hover:border-green-400 transition-all relative`}
              >
                {selectedIds.length === filteredData.length &&
                  filteredData.length > 0 && (
                    <svg
                      className="absolute inset-0 w-5 h-5 text-white pointer-events-none scale-90"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={5}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M20 6L9 17l-5-5"
                      />
                    </svg>
                  )}
              </div>
            </label>
          </div>

          <div className="flex flex-row items-center flex-1 gap-12 min-w-0">
            <div className="w-10 h-10 bg-transparent" />
            <div className="flex w-[400px] flex-col items-start gap-2">
              <div className="text-left w-full">
                <span className="text-white text-[12px] font-semibold">
                  Title
                </span>
                <span className="text-[10px] text-[rgba(204,204,204,0.5)]">
                  Description
                </span>
              </div>
            </div>
            <div className="flex flex-row gap-[150px] flex-1 items-center">
              <span className="text-white text-[12px] font-semibold min-w-[100px]">
                Date
              </span>
              <span className="text-white text-[12px] font-semibold min-w-[100px]">
                Author
              </span>
              <span className="text-white text-[12px] font-semibold min-w-[120px]">
                Status
              </span>
            </div>
          </div>
        </div>

        {/* Cards */}
        <div className="flex flex-col w-full min-h-[200px] justify-center items-center">
          {filteredData.length === 0 ? (
            <div className="text-gray-400 py-10 text-center text-sm">
              No {type} content found.
            </div>
          ) : (
            paginatedData.map((card) => {
              const contentType = card.content_type as
                | "post"
                | "mindmap"
                | "research";
              return (
                <ContentCard
                  key={card.id}
                  {...card}
                  type={contentType}
                  isSelected={selectedIds.includes(card.id)}
                  onSelect={handleSelect}
                  onDelete={() => handleDelete(card.id, contentType)}
                  onOpenComments={() => handleOpenComments(card)}
                />
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between w-full border-t border-[rgba(145,158,171,0.2)] py-3 px-5 bg-white/[0.05]">
          <div className="flex items-center gap-3">
            <span className="text-white text-[12px] opacity-80">
              {selectedIds.length} row
              {selectedIds.length !== 1 ? "s" : ""} selected
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

          {/* Pagination Controls */}
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

            <span className="text-white text-[12px] text-center min-w-[100px]">
              Page {totalPages > 0 ? currentPage : 0} of {totalPages}
            </span>

            <div className="flex items-center gap-2">
              <button
                onClick={goToFirstPage}
                disabled={currentPage === 1}
                className={`w-8 h-8 flex items-center justify-center rounded-[6px] text-white ${
                  currentPage === 1
                    ? "bg-gray-600 cursor-not-allowed"
                    : "bg-white/[0.1] hover:bg-white/[0.2]"
                }`}
              >
                &lt;&lt;
              </button>
              <button
                onClick={goToPreviousPage}
                disabled={currentPage === 1}
                className={`w-8 h-8 flex items-center justify-center rounded-[6px] text-white ${
                  currentPage === 1
                    ? "bg-gray-600 cursor-not-allowed"
                    : "bg-white/[0.1] hover:bg-white/[0.2]"
                }`}
              >
                &lt;
              </button>
              <button
                onClick={goToNextPage}
                disabled={currentPage === totalPages || totalPages === 0}
                className={`w-8 h-8 flex items-center justify-center rounded-[6px] text-white ${
                  currentPage === totalPages || totalPages === 0
                    ? "bg-gray-600 cursor-not-allowed"
                    : "bg-white/[0.1] hover:bg-white/[0.2]"
                }`}
              >
                &gt;
              </button>
              <button
                onClick={goToLastPage}
                disabled={currentPage === totalPages || totalPages === 0}
                className={`w-8 h-8 flex items-center justify-center rounded-[6px] text-white ${
                  currentPage === totalPages || totalPages === 0
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
          content_body={selectedContent.content_body}
          comments={comments}
          tags={selectedContent.tags || []}
          onClose={() => setIsPopupOpen(false)}
          onAddComment={handleAddComment}
        />
      )}
    </>
  );
}
