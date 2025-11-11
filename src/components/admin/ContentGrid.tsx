"use client";

import { useState, useEffect, useMemo } from "react";
import ContentCard from "./ContentCard";
import CommentsPopup from "./CommentsPopup";
import { useContent } from "@/hooks/useContent";

import { CONTENT_STATUS, CONTENT_TYPES } from "@/lib/enums";
import { AnyContent, Comment } from "@/types/content";
import Image from "next/image";
import CategoryGridSkeleton from "./CategoryGridSkeleton";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css"; 
import SharePopup from "../content/SharePopup";
interface ContentGridProps {
  type?: "all" | "post" | "research" | "mindmap";
}

export default function ContentGrid({ type = "all" }: ContentGridProps) {
  const { data = [], loading, error, refetch } = useContent({ type });

  

  // Filters
  const [search, setSearch] = useState("");
  // Status multi-select
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);
  const [statusSearch, setStatusSearch] = useState("");
  const [statusDropdownOpen, setStatusDropdownOpen] = useState(false);
   const [selectedShareData, setSelectedShareData] = useState<{
    id: string;
    title: string;
    type: "post" | "mindmap" | "research";
  } | null>(null);

  // Category multi-select
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [categorySearch, setCategorySearch] = useState("");
  const [categoryDropdownOpen, setCategoryDropdownOpen] = useState(false);
  const [rowsDropdownOpen, setRowsDropdownOpen] = useState(false);

  // NEW: Author Email multi-select
  const [selectedAuthorEmails, setSelectedAuthorEmails] = useState<string[]>([]);
  const [authorEmailSearch, setAuthorEmailSearch] = useState("");
  const [authorEmailDropdownOpen, setAuthorEmailDropdownOpen] = useState(false);
  // NEW: Created Date range
  const [createdAfter, setCreatedAfter] = useState("");
  const [createdBefore, setCreatedBefore] = useState("");

  // Example categories list (you can replace with actual)
  const categoriesList = Array.from(new Set(data.map((d) => d.categoryName || d.category_id || "")));

  // NEW: Example author emails list (from data)
  const authorEmailsList = Array.from(new Set(data.map((d) => d.authorEmail || "").filter(Boolean)));


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

  // Multi-select status
  if (selectedStatuses.length)
    filtered = filtered.filter((i) => selectedStatuses.includes(i.status));

  // Multi-select category
  if (selectedCategories.length)
    filtered = filtered.filter((i) =>
      selectedCategories.includes(i.categoryName || i.category_id || "")
    );

  // NEW: Multi-select author email
  if (selectedAuthorEmails.length)
    filtered = filtered.filter((i) => selectedAuthorEmails.includes(i.authorEmail || ""));

  // NEW: Created date range
  if (createdAfter) {
    const afterDate = new Date(createdAfter);
    if (!isNaN(afterDate.getTime())) {
      filtered = filtered.filter((i) => i.created_at && new Date(i.created_at) >= afterDate);
    }
  }
  if (createdBefore) {
    const beforeDate = new Date(createdBefore);
    if (!isNaN(beforeDate.getTime())) {
      filtered = filtered.filter((i) => i.created_at && new Date(i.created_at) <= beforeDate);
    }
  }

  return filtered;
}, [data, search, selectedStatuses, selectedCategories, selectedAuthorEmails, createdAfter, createdBefore]);

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
}, [search, selectedStatuses, selectedCategories, selectedAuthorEmails, createdAfter, createdBefore]);

 const removeFromArray = (
  arr: string[],
  setFn: React.Dispatch<React.SetStateAction<string[]>>,
  val: string
) => setFn(arr.filter((i) => i !== val));

const addToArray = (
  arr: string[],
  setFn: React.Dispatch<React.SetStateAction<string[]>>,
  val: string,
  list: string[]
) => {
  if (!arr.includes(val) && list.includes(val)) setFn([...arr, val]);
};

const clearAllFilters = () => {
  setSelectedStatuses([]);
  setSelectedCategories([]);
  setSelectedAuthorEmails([]);  // NEW
  setStatusSearch("");
  setCategorySearch("");
  setAuthorEmailSearch("");  // NEW
  setCreatedAfter("");  // NEW
  setCreatedBefore("");  // NEW
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
      <div className="flex justify-center  text-gray-400 text-lg">
        <CategoryGridSkeleton/>
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
          overflow: "visible",
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

  {/* Top Row: Search + Filters (Fixed layout) */}
  <div className="flex flex-wrap items-end gap-3 mb-3">
    {/* 🔍 Main Search */}
    <div className="flex-1 min-w-[250px]">
      <label className="block text-white text-[12px] mb-1">Search</label>
      <input
        type="text"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search..."
        className="w-full px-4 py-2 text-sm text-white bg-white/[0.08] border border-white/[0.15] rounded-md focus:outline-none focus:ring-1 focus:ring-white/[0.25] placeholder:text-gray-400"
      />
    </div>

    {/* 🚦 Statuses Dropdown */}
    <div className="w-[200px] relative">
      <label className="block text-white text-[12px] mb-1">Statuses</label>
      <input
        type="text"
        value={statusSearch}
        onChange={(e) => {
          setStatusSearch(e.target.value);
          setStatusDropdownOpen(true);
        }}
        onFocus={() => setStatusDropdownOpen(true)}
        placeholder="Type to search..."
        className="w-full px-2 py-2 text-sm text-white bg-white/[0.08] border border-white/[0.15] rounded-md focus:outline-none focus:ring-1 focus:ring-white/[0.25] placeholder:text-gray-400"
      />
      {statusDropdownOpen && (
        <div className="absolute top-full left-0 w-full mt-1 bg-black/80 border border-white/20 rounded-lg backdrop-blur-2xl shadow-[0_0_15px_rgba(0,0,0,0.4)] z-50 max-h-48 overflow-y-auto">
          {Object.values(CONTENT_STATUS)
            .filter((s) => s.toLowerCase().includes(statusSearch.toLowerCase()))
            .map((s) => (
              <div
                key={s}
                onClick={() => {
                  addToArray(selectedStatuses, setSelectedStatuses, s, Object.values(CONTENT_STATUS));
                  setStatusSearch("");
                  setStatusDropdownOpen(false);
                }}
                className="p-2 text-white text-sm hover:bg-white/20 cursor-pointer rounded-md transition"
              >
                {s.replace("_", " ").toUpperCase()}
              </div>
            ))}
          {Object.values(CONTENT_STATUS).filter((s) =>
            s.toLowerCase().includes(statusSearch.toLowerCase())
          ).length === 0 && (
            <div className="p-2 text-gray-400 text-sm italic">No statuses found</div>
          )}
        </div>
      )}
    </div>

    {/* 🏷️ Categories Dropdown */}
    <div className="w-[200px] relative">
      <label className="block text-white text-[12px] mb-1">Categories</label>
      <input
        type="text"
        value={categorySearch}
        onChange={(e) => {
          setCategorySearch(e.target.value);
          setCategoryDropdownOpen(true);
        }}
        onFocus={() => setCategoryDropdownOpen(true)}
        placeholder="Type to search..."
        className="w-full px-2 py-2 text-sm text-white bg-white/[0.08] border border-white/[0.15] rounded-md focus:outline-none focus:ring-1 focus:ring-white/[0.25] placeholder:text-gray-400"
      />
       {categoryDropdownOpen && (
              <div
                className="absolute top-full left-0 w-full mt-1 bg-black/80 border border-white/20 rounded-lg backdrop-blur-2xl shadow-[0_0_15px_rgba(0,0,0,0.4)] z-50 max-h-48 overflow-y-scroll"
                style={{
                  scrollbarWidth: "none", // Firefox
                  msOverflowStyle: "none", // IE/Edge
                }}
              >
                {/* Hide scrollbar for Chrome, Safari, Edge */}
                <style>
                  {`
                    div::-webkit-scrollbar {
                      display: none;
                    }
                  `}
                </style>
                {categoriesList
                  .filter((cat) => cat.toLowerCase().includes(categorySearch.toLowerCase()))
                  .map((cat) => (
                    <div
                      key={cat}
                      onClick={() => { addToArray(selectedCategories, setSelectedCategories, cat, categoriesList); setCategorySearch(""); setCategoryDropdownOpen(false); }}
                      className="p-2 text-white text-sm hover:bg-white/20 cursor-pointer rounded-md"
                    >
                      {cat}
                    </div>
                  ))}
              </div>
            )}
    </div>
     {/* NEW: 👤 Author Emails Dropdown */}
      <div className="w-[200px] relative">
        <label className="block text-white text-[12px] mb-1">Author Emails</label>
        <input
          type="text"
          value={authorEmailSearch}
          onChange={(e) => {
            setAuthorEmailSearch(e.target.value);
            setAuthorEmailDropdownOpen(true);
          }}
          onFocus={() => setAuthorEmailDropdownOpen(true)}
          placeholder="Type to search..."
          className="w-full px-2 py-2 text-sm text-white bg-white/[0.08] border border-white/[0.15] rounded-md focus:outline-none focus:ring-1 focus:ring-white/[0.25] placeholder:text-gray-400"
        />
        {authorEmailDropdownOpen && (
          <div
            className="absolute top-full left-0 w-full mt-1 bg-black/80 border border-white/20 rounded-lg backdrop-blur-2xl shadow-[0_0_15px_rgba(0,0,0,0.4)] z-50 max-h-48 overflow-y-auto"
            style={{
              scrollbarWidth: "none", // Firefox
              msOverflowStyle: "none", // IE/Edge
            }}
          >
            {/* Hide scrollbar for Chrome, Safari, Edge */}
            <style>
              {`
                div::-webkit-scrollbar {
                  display: none;
                }
              `}
            </style>
            {authorEmailsList
              .filter((email) => email.toLowerCase().includes(authorEmailSearch.toLowerCase()))
              .map((email) => (
                <div
                  key={email}
                  onClick={() => { addToArray(selectedAuthorEmails, setSelectedAuthorEmails, email, authorEmailsList); setAuthorEmailSearch(""); setAuthorEmailDropdownOpen(false); }}
                  className="p-2 text-white text-sm hover:bg-white/20 cursor-pointer rounded-md"
                >
                  {email}
                </div>
              ))}
            {authorEmailsList.filter((email) =>
              email.toLowerCase().includes(authorEmailSearch.toLowerCase())
            ).length === 0 && (
              <div className="p-2 text-gray-400 text-sm italic">No emails found</div>
            )}
          </div>
        )}
      </div>
                        {/* 📅 Created From */}
                        <div className="w-[120px]">
                          <label className="block text-white text-[12px] mb-1">Created After</label>
                          <div className="relative">
                            <DatePicker
                              selected={createdAfter ? new Date(createdAfter) : null}
                              onChange={(date) => setCreatedAfter(date ? date.toISOString().split("T")[0] : "")}
                              className="w-full p-2 pr-10 bg-white/10 border border-white/20 rounded-lg text-white text-sm backdrop-blur-md shadow-[inset_0_0_10px_rgba(255,255,255,0.2)] focus:outline-none focus:ring-2 focus:ring-white/30"
                              dateFormat="yyyy-MM-dd"
                              placeholderText="Select date"
                            />
                            <Image
                              src="/date.svg"
                              alt="Date Icon"
                              width={16}
                              height={16}
                              className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none opacity-80 transition-opacity duration-150"
                            />
                          </div>
                        </div>
      
                        {/* 📅 Created To */}
                        <div className="w-[120px]">
                          <label className="block text-white text-[12px] mb-1">Created Before</label>
                          <div className="relative">
                            <DatePicker
                              selected={createdBefore ? new Date(createdBefore) : null}
                              onChange={(date) => setCreatedBefore(date ? date.toISOString().split("T")[0] : "")}
                              className="w-full p-2 pr-10 bg-white/10 border border-white/20 rounded-lg text-white text-sm backdrop-blur-md shadow-[inset_0_0_10px_rgba(255,255,255,0.2)] focus:outline-none focus:ring-2 focus:ring-white/30"
                              dateFormat="yyyy-MM-dd"
                              placeholderText="Select date"
                            />
                            <Image
                              src="/date.svg"
                              alt="Date Icon"
                              width={16}
                              height={16}
                              className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none opacity-80 transition-opacity duration-150"
                            />
                          </div>
                        </div>
  </div>

  {/* Bottom Row: Pills + Clear Button */}
  {(selectedStatuses.length > 0 || selectedCategories.length > 0 || selectedAuthorEmails.length > 0) && (
    <div className="flex gap-3 items-start">
      {/* Selected Statuses */}
      {selectedStatuses.length > 0 && (
        <div className="flex-shrink-0 bg-white/[0.08] border border-dashed border-[rgba(145,158,171,0.2)] rounded-md p-2 min-h-[40px] w-fit max-w-[450px]">
          <div className="flex flex-wrap gap-1">
            {selectedStatuses.map((status) => (
              <div
                key={status}
                className="flex items-center gap-1 bg-[rgba(255,255,255,0.1)] border border-[rgba(255,255,255,0.15)] rounded-[20px] h-[25px] px-2 py-1 text-[12px] text-[rgba(255,255,255,0.9)] max-w-[150px] whitespace-nowrap overflow-hidden text-ellipsis transition-all hover:bg-white/20"
              >
                <span className="truncate max-w-[60px]">{status}</span>
                <button
                  onClick={() => removeFromArray(selectedStatuses, setSelectedStatuses, status)}
                  className="flex items-center justify-center w-[15px] h-[15px] rounded-full bg-white text-black text-[16px] cursor-pointer p-0 border-none hover:bg-gray-100 transition"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Selected Categories */}
      {selectedCategories.length > 0 && (
        <div className="flex-shrink-0 bg-white/[0.08] border border-dashed border-[rgba(145,158,171,0.2)] rounded-md p-2 min-h-[40px] w-fit max-w-[350px]">
          <div className="flex flex-wrap gap-1">
            {selectedCategories.map((cat) => (
              <div
                key={cat}
                className="flex items-center gap-1 bg-[rgba(255,255,255,0.1)] border border-[rgba(255,255,255,0.15)] rounded-[20px] h-[25px] px-2 py-1 text-[12px] text-[rgba(255,255,255,0.9)] max-w-[150px] whitespace-nowrap overflow-hidden text-ellipsis transition-all hover:bg-white/20"
              >
                <span className="truncate max-w-[60px]">{cat}</span>
                <button
                  onClick={() => removeFromArray(selectedCategories, setSelectedCategories, cat)}
                  className="flex items-center justify-center w-[15px] h-[15px] rounded-full bg-white text-black text-[16px] cursor-pointer p-0 border-none hover:bg-gray-100 transition"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </div>
        
      )}
      {/* NEW: Selected Author Emails */}
      {selectedAuthorEmails.length > 0 && (
        <div className="flex-shrink-0 bg-white/[0.08] border border-dashed border-[rgba(145,158,171,0.2)] rounded-md p-2 min-h-[40px] w-fit max-w-[350px]">
          <div className="flex flex-wrap gap-1">
            {selectedAuthorEmails.map((email) => (
              <div
                key={email}
                className="flex items-center gap-1 bg-[rgba(255,255,255,0.1)] border border-[rgba(255,255,255,0.15)] rounded-[20px] h-[25px] px-2 py-1 text-[12px] text-[rgba(255,255,255,0.9)] max-w-[150px] whitespace-nowrap overflow-hidden text-ellipsis transition-all hover:bg-white/20"
              >
                <span className="truncate max-w-[60px]">{email}</span>
                <button
                  onClick={() => removeFromArray(selectedAuthorEmails, setSelectedAuthorEmails, email)}
                  className="flex items-center justify-center w-[15px] h-[15px] rounded-full bg-white text-black text-[16px] cursor-pointer p-0 border-none hover:bg-gray-100 transition"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Clear Button */}
      <button
        onClick={clearAllFilters}
        className="flex items-center gap-1 text-red-500 hover:text-red-600 text-sm font-medium transition-all mt-2"
      >
        <Image
          src="/redtrash.svg"
          alt="Clear Filters"
          width={20}
          height={20}
          style={{ marginRight: "6px" }}
        />
        <span>Clear</span>
      </button>
    </div>
  )}
</div>


        {/* Header Row (checkbox + labels) */}
        <div
          className="relative flex flex-row items-center justify-between border-b border-[rgba(145,158,171,0.2)]"
          style={{
            width: "100%",
            height: "76px",
            padding: "16px",
          }}
        >
          {/* Select All Checkbox */}
        <div className="relative shrink-0 ml-2 cursor-pointer">
          <input
            type="checkbox"
            checked={selectedIds.length === filteredData.length && filteredData.length > 0}
            onChange={selectAll}
            className="absolute opacity-0 w-5 h-5 cursor-pointer peer"
            id="select-all-header"
          />
          <label htmlFor="select-all-header">
            <div
              className="w-5 h-5 rounded-lg border border-[rgba(145,158,171,0.2)] bg-transparent transition-all shadow-sm relative hover:border-gray-300"
            >
              {selectedIds.length === filteredData.length && filteredData.length > 0 && (
                <div className="absolute inset-1 bg-white rounded-sm" />
              )}
            </div>
          </label>
        </div>


        {/* Labels */}
          <div className="flex flex-row items-center flex-1 gap-12 min-w-0">
            {/* Avatar Placeholder */}
            <div className="w-15 h-10 bg-transparent" />

            {/* Email / User ID Labels */}
            <div className="flex w-[355px] flex-col items-start gap-2 shrink-0">
              <div className="text-left w-full">
                <span className="text-white text-[14px] font-semibold">
                  Research 
                </span>
                <span className="text-[14px] text-[rgba(204,204,204,0.5)]">
                </span>
              </div>
            </div>

            {/* Date / Role / Status / Full Email Labels */}
            <div className="flex flex-row gap-[100px] flex-1 min-w-0 items-center">
              <span className="text-white text-[14px] font-semibold min-w-[100px] text-center">
                Date Created
              </span>
              <span className="text-white text-[14px] font-semibold min-w-[100px] text-center">
                Author
              </span>
              <span className="text-white text-[14px] font-semibold min-w-[120px] text-center">
                Status
              </span>
            </div>
          </div>
        </div>

        {/* 🧾 Content Cards */}
        <div className="flex flex-col w-full items-center justify-start">
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
                commentCount={commentCounts[card.id] || 0}// ✅ pass count
                onOpenShare={(data) => setSelectedShareData(data)}
              />
            ))
          )}
        </div>

        {/* 🔢 Footer + Pagination */}
        <div className="flex items-center justify-between w-full border-t border-[rgba(145,158,171,0.2)] py-3 px-5 bg-white/[0.05]">
          <div className="flex items-center gap-3">
            <span className="text-white text-[12px] opacity-80">
              {selectedIds.length} research{selectedIds.length !== 1 ? "s" : ""} selected
            </span>
            {selectedIds.length > 0 && (
              <>
                <button
                  onClick={handleDeleteSelected}
                  className="relative w-[150px] h-[30px] rounded-full bg-white/[0.05] border border-white/10 shadow-[inset_0_0_4px_rgba(239,214,255,0.25)] backdrop-blur-[10px] text-white font-bold text-sm flex items-center justify-center transition hover:scale-[1.02] overflow-hidden"
                >
                  <span className="absolute inset-0 rounded-full bg-[radial-gradient(circle,rgba(255,99,99,0.5)_0%,transparent_70%)] blur-md" />
                <span className="relative z-10">Delete Selected</span>
                  
                </button>
                <button
                  onClick={() => setSelectedIds([])}
                  className="relative w-[150px] h-[30px] rounded-full bg-white/[0.05] border border-white/10 shadow-[inset_0_0_4px_rgba(239,214,255,0.25)] backdrop-blur-[10px] text-white font-bold text-sm flex items-center justify-center transition hover:scale-[1.02] overflow-hidden"
                >
                  <span className="absolute inset-0 rounded-full bg-[radial-gradient(circle,rgba(255,99,99,0.5)_0%,transparent_70%)] blur-md" />
                <span className="relative z-10"> Unselect All</span>
                 
                </button>
              </>
            )}
          </div>

           {/* Pagination (right) */}
          <div className="flex items-center gap-2">
            {/* Rows per page selector */}
            <div className="relative flex items-center gap-1">
              <span className="text-[12px] text-gray-300 whitespace-nowrap">
                Rows per page:
              </span>

              {/* Selector button */}
              <div
                onClick={() => setRowsDropdownOpen(!rowsDropdownOpen)}
                className="flex items-center justify-center bg-transparent text-white text-[12px] px-2 py-1 w-[60px] rounded-full outline-none border border-white/[0.2] hover:bg-white/[0.1] transition-all text-center cursor-pointer focus:ring-1 focus:ring-green-400"
              >
                {itemsPerPage === filteredData.length ? "All" : itemsPerPage}
                <span className="ml-1  text-[10px]">▼</span>
              </div>

              {/* Dropdown menu */}
              {rowsDropdownOpen && (
                <div className="absolute left-[100px] top-full mt-[2px] w-[40px] bg-black/80 border border-white/20 rounded-lg backdrop-blur-2xl shadow-[0_0_10px_rgba(0,0,0,0.4)] z-50">
                  {[5, 10, 20, "All"].map((option) => (
                    <div
                      key={option}
                      onClick={() => {
                        const val = option === "All" ? filteredData.length : Number(option);
                        setItemsPerPage(val);
                        setCurrentPage(1);
                        setRowsDropdownOpen(false);
                      }}
                 className={`px-2 py-1 text-[12px] text-white hover:bg-white/10 hover:rounded-[7px] cursor-pointer text-center transition-all ${
                  (option === "All" && itemsPerPage === filteredData.length) ||
                  option === itemsPerPage
                    ? "bg-white/10 rounded-[7px]"
                    : ""
                }`}

                    >
                      {option}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Page info */}
            <span className="text-white text-[12px] text-center min-w-[100px]">
              Page {totalPages > 0 ? currentPage : 0} of {totalPages} 
            </span>

            <div className="flex items-center gap-2">
              <button
                onClick={() => goToPage(currentPage - 1)}
                disabled={currentPage === 1}
                className={`w-8 h-8 flex items-center justify-center rounded-[6px] transition-all
                  ${currentPage === 1 || totalPages === 0
                    ? "opacity-40 cursor-not-allowed"
                    : "hover:bg-white/[0.08] hover:backdrop-blur-sm cursor-pointer"
                  }`}
              >
                <Image
                                  src="/left1.svg"
                                  alt="First page"
                                  width={6}
                                  height={6}
                                  className="opacity-90"
                                />
              </button>
              <button
                onClick={() => goToPage(1)}
                disabled={currentPage === 1}
                className={`w-8 h-8 flex items-center justify-center rounded-[6px] transition-all
                  ${currentPage === 1 || totalPages === 0
                    ? "opacity-40 cursor-not-allowed"
                    : "hover:bg-white/[0.08] hover:backdrop-blur-sm cursor-pointer"
                  }`}
              >
                <Image
                                  src="/left2.svg"
                                  alt="Previous page"
                                  width={10}
                                  height={10}
                                  className="opacity-90"
                                />
              </button>
              <button
                onClick={() => goToPage(totalPages)}
                disabled={currentPage === totalPages || totalPages === 0}
                className={`w-8 h-8 flex items-center justify-center rounded-[6px] transition-all
                  ${currentPage === totalPages || totalPages === 0
                    ? "opacity-40 cursor-not-allowed"
                    : "hover:bg-white/[0.08] hover:backdrop-blur-sm cursor-pointer"
                  }`}
              >
                 <Image
                                  src="/right2.svg"
                                  alt="Next page"
                                  width={10}
                                  height={10}
                                  className="opacity-90"
                                />
              </button>
              <button
                onClick={() => goToPage(currentPage + 1)}
                disabled={currentPage === totalPages || totalPages === 0}
                className={`w-8 h-8 flex items-center justify-center rounded-[6px] transition-all
                  ${currentPage === totalPages || totalPages === 0
                    ? "opacity-40 cursor-not-allowed"
                    : "hover:bg-white/[0.08] hover:backdrop-blur-sm cursor-pointer"
                  }`}
              >
                <Image
                                  src="/right1.svg"
                                  alt="Last page"
                                  width={6}
                                  height={6}
                                  className="opacity-90"
                                />
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
          onClose={() => setIsPopupOpen(false)}
          onAddComment={handleAddComment}
        />
      )}

      {/* Share Popup */}
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
    </>
  );
}
