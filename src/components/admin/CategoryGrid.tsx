"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import CategoryCard from "./CategoryCard"; // NEW: Use CategoryCard
import { useAdminCategories } from "@/hooks/useAdminCategories"; // FIXED: Use categories hook

import { TAG_CATEGORY_STATUS } from "@/lib/enums"; // For category status (no roles)
import Image from "next/image";
import CategoryGridSkeleton from "./CategoryGridSkeleton";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css"; 
import { usePathname } from "next/navigation";

export default function CategoryGrid() {
  const { requests, loading, error, approveCategory, rejectCategory } = useAdminCategories(); // FIXED: Categories hook + renamed functions

  // DEBUG: Log hook data immediately (check if requests has category_name)
  console.log("Grid: Hook data - requests length:", requests.length, "First category_name:", requests[0]?.category_name, "Error:", error); // DEBUG: Should be 10, "Databases", null

  // Filters (client-side – status only, no roles)
  const [search, setSearch] = useState("");
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]); // Multi-select for statuses only

  // NEW: Filters for date and author
  const [createdFrom, setCreatedFrom] = useState<string>(""); // ISO date string (e.g., "2023-01-01")
  const [createdTo, setCreatedTo] = useState<string>(""); // ISO date string (e.g., "2023-12-31")
  const [selectedAuthors, setSelectedAuthors] = useState<string[]>([]); // Multi-select for authors
  const [authorSearch, setAuthorSearch] = useState(""); // For dropdown input
  const [authorDropdownOpen, setAuthorDropdownOpen] = useState(false);

  // 1️⃣ Add a new state for mobile collapse toggle
  // 1️⃣ Add a new state for mobile collapse toggle
    const pathname = usePathname();
    const [filtersOpen, setFiltersOpen] = useState(false);
  
     useEffect(() => {
      setFiltersOpen(false); // Reset filtersOpen whenever route changes
    }, [pathname]);
  

  const [statusSearch, setStatusSearch] = useState("");
  const [statusDropdownOpen, setStatusDropdownOpen] = useState(false);
  const [rowsDropdownOpen, setRowsDropdownOpen] = useState(false);

  // Compute unique authors from requests
  const uniqueAuthors = useMemo(() => [...new Set(requests.map(r => r.authorEmail).filter((email): email is string => Boolean(email)))], [requests]);


  // Selection + Pagination
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState<number>(() => {
  if (typeof window !== "undefined") {
    const saved = localStorage.getItem("category-items-per-page");
    return saved ? Number(saved) : 5; // default 5 if none saved
  }
  return 5;
  });

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("category-items-per-page", itemsPerPage.toString());
    }
  }, [itemsPerPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [itemsPerPage, search, selectedStatuses, createdFrom, createdTo, selectedAuthors]);


  /** 🧠 Client-side filtering (status, date range, author search by category_name or user_id) */
  const filteredData = useMemo(() => {
    let filtered = requests || [];

    // 🔍 Search filter (category_name or user_id)
    if (search.trim()) {
      const query = search.toLowerCase();
      filtered = filtered.filter(
        (item) =>
          item.category_name?.toLowerCase().includes(query) || // FIXED: category_name
          item.user_id?.toLowerCase().includes(query)
      );
    }

    // ⚙️ Multi-status filter (partial match on array – TAG_CATEGORY_STATUS only)
    if (selectedStatuses.length > 0) {
      filtered = filtered.filter((item) =>
        selectedStatuses.some((status) =>
          item.status.toLowerCase().includes(status.toLowerCase())
        )
      );
    }

    // 📅 Date range filter (created_at – assumes ISO string; inclusive)
    if (createdFrom || createdTo) {
      filtered = filtered.filter((item) => {
        const itemDate = new Date(item.created_at); // Parse created_at (ISO string)
        const fromDate = createdFrom ? new Date(createdFrom) : null;
        const toDate = createdTo ? new Date(createdTo) : null;
        if (fromDate && itemDate < fromDate) return false;
        if (toDate && itemDate > toDate) return false;
        return true;
      });
    }

    // 👤 Author filter (selected authors – exact match)
    if (selectedAuthors.length > 0) {
      filtered = filtered.filter((item) =>
        selectedAuthors.some((author) =>
          item.authorEmail?.toLowerCase() === author.toLowerCase()
        )
      );
    }

    // DEBUG: Log after filtering (check if filters hide data)
    console.log("Grid: Filtered data length:", filtered.length, "First category_name after filter:", filtered[0]?.category_name, "Search:", search, "Statuses:", selectedStatuses, "Created From:", createdFrom, "Created To:", createdTo, "Selected Authors:", selectedAuthors); // DEBUG: Should be 10, "Databases", "", []

    return filtered;
  }, [requests, search, selectedStatuses, createdFrom, createdTo, selectedAuthors]); // Deps include new filters

  /** Pagination */
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const paginatedData = filteredData.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // DEBUG: Log pagination (check if page/filter hides cards)
  console.log("Grid: Paginated data length:", paginatedData.length, "Current page:", currentPage, "Items per page:", itemsPerPage); // DEBUG: Should be 5, 1, 5

  // Reset page on filter change
  useEffect(() => {
    setCurrentPage(1);
  }, [search, selectedStatuses, createdFrom, createdTo, selectedAuthors]); // Include new filters

  /** NEW: Pill Multi-Select Handlers (statuses only) */
  // Add item to array (on Enter, comma, or blur)
  const addToArray = <T extends string>(
    array: T[],
    setArray: React.Dispatch<React.SetStateAction<T[]>>,
    value: string,
    allowedValues?: T[] // Optional enum for validation
  ) => {
    if (!value.trim()) return;
    const trimmed = value.trim().toLowerCase();
    // Prevent duplicates
    if (array.some((item) => item.toLowerCase() === trimmed)) return;
    // Optional: Validate against enum
    if (allowedValues && !allowedValues.some((val) => val.toLowerCase().includes(trimmed))) {
      alert(`Invalid value: ${value}. Must match enum (e.g., ${allowedValues.join(", ")})`);
      return;
    }
    setArray((prev) => [...prev, trimmed as T]);
  };

  

  // Remove item from array
  const removeFromArray = <T extends string>(
    array: T[],
    setArray: React.Dispatch<React.SetStateAction<T[]>>,
    valueToRemove: T
  ) => {
    setArray((prev) => prev.filter((item) => item !== valueToRemove));
  };

  // Clear all (statuses, dates, author)
  const clearAllFilters = () => {
    setSelectedStatuses([]);
    setCreatedFrom("");
    setCreatedTo("");
    setSelectedAuthors([]);
    setAuthorSearch("");
  };

  // Handle keydown for adding (Enter, comma)
  const handleKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>,
    addFn: (value: string) => void
  ) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      const value = e.currentTarget.value.trim();
      if (value) addFn(value);
      e.currentTarget.value = ""; // Clear input
    }
  };

  // Handle blur for adding (Tab or click away)
  const handleBlur = (
    e: React.FocusEvent<HTMLInputElement>,
    addFn: (value: string) => void
  ) => {
    const value = e.currentTarget.value.trim();
    if (value) {
      addFn(value);
      e.currentTarget.value = "";
    }
  };

  /** Approve/Reject Handlers (uses hook – silent, reload after) */
  const handleApprove = async (id: string) => {
    try {
      await approveCategory(id); // FIXED: approveCategory from hook
      setSelectedIds((prev) => prev.filter((s) => s !== id)); // Remove from selection
      window.location.reload(); // FIXED: Silent reload for fresh data (updates status/UI)
    } catch (err: unknown) {
      console.error("Approve error:", err); // Silent log (no alert)
    }
  };

  const handleReject = async (id: string) => {
    try {
      await rejectCategory(id); // FIXED: rejectCategory from hook
      setSelectedIds((prev) => prev.filter((s) => s !== id)); // Remove from selection
      window.location.reload(); // FIXED: Silent reload for fresh data (updates status/UI)
    } catch (err: unknown) {
      console.error("Reject error:", err); // Silent log (no alert)
    }
  };

  // Bulk approve (no confirm/message – immediate, loop + silent reload after)
  const bulkApproveSelected = async () => {
    if (!selectedIds.length) return;
    try {
      for (const id of selectedIds) {
        await approveCategory(id); // FIXED: approveCategory from hook
      }
      setSelectedIds([]); // Clear selection
      window.location.reload(); // FIXED: Silent reload after bulk (updates UI status/list)
    } catch (err: unknown) {
      console.error("Bulk approve error:", err); // Silent log (no alert)
    }
  };

  // Bulk reject (no confirm/message – immediate, loop + silent reload after)
  const bulkRejectSelected = async () => {
    if (!selectedIds.length) return;
    try {
      for (const id of selectedIds) {
        await rejectCategory(id); // FIXED: rejectCategory from hook
      }
      setSelectedIds([]); // Clear selection
      window.location.reload(); // FIXED: Silent reload after bulk (updates UI status/list)
    } catch (err: unknown) {
      console.error("Bulk reject error:", err); // Silent log (no alert)
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
        : filteredData.map((r) => r.id)
    );

  /** Pagination Controls */
  const goToFirstPage = () => setCurrentPage(1);
  const goToPreviousPage = () =>
    currentPage > 1 && setCurrentPage(currentPage - 1);
  const goToNextPage = () =>
    currentPage < totalPages && setCurrentPage(currentPage + 1);
  const goToLastPage = () => setCurrentPage(totalPages);

    const statusesRef = useRef<HTMLDivElement>(null);
    const authorRef = useRef<HTMLDivElement>(null);
      
    useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        // Close Status dropdown if clicked outside
        if (statusesRef.current && !statusesRef.current.contains(event.target as Node)) {
          setStatusDropdownOpen(false);
        }
        // Close author dropdown if clicked outside
        if (authorRef.current && !authorRef.current.contains(event.target as Node)) {
          setAuthorDropdownOpen(false);
        }
      };
      
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

  /** Loading/Error States */
  if (loading)
    return (
      <div className="flex justify-center  text-gray-400 text-lg">
        <CategoryGridSkeleton />
      </div>
    );

  if (error)
    return (
      <div className="flex justify-center py-10 text-red-500">
        Error: {error}
      </div>
    );

  if (!requests || requests.length === 0)
    return (
      <div className="flex justify-center py-10 text-gray-400">
        No category requests available. {/* FIXED: category requests */}
      </div>
    );

  /** Render UI */
  return (
    <>
     <div
        className="flex flex-col items-center justify-start mx-auto w-full max-w-[1200px]"
        style={{
          backgroundColor: "rgba(255,255,255,0.05)",
          borderRadius: "10px",
          border: "1px solid rgba(80,80,80,0.24)",
          boxShadow: "inset 0 0 7px rgba(255,255,255,0.16)",
          backdropFilter: "blur(12px)",
          overflow: "visible",
        }}
      >
        {/* 🧠 Stats Summary (counts from filtered data – category statuses) */}
        <div className="flex flex-wrap gap-2 w-full px-5 py-4 border-b border-[rgba(145,158,171,0.2)] bg-white/[0.05]">
          {[
            { label: "All", color: "#9CA3AF", count: filteredData.length },
            {
              label: "Pending",
              color: "rgba(255, 171, 0, 0.16)",
              count: filteredData.filter((r) => r.status === TAG_CATEGORY_STATUS.PENDING).length,
            },
            {
              label: "Approved",
              color: "rgba(34, 197, 94, 0.16)",
              count: filteredData.filter((r) => r.status === TAG_CATEGORY_STATUS.APPROVED).length,
            },
            {
              label: "Rejected",
              color: "rgba(255,86,48,0.16)",
              count: filteredData.filter((r) => r.status === TAG_CATEGORY_STATUS.REJECTED).length,
            },
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
          {/* Top Row: Search + Filters (Fixed layout) */}
          <div className="flex flex-col gap-4 mb-3 md:flex-row md:flex-wrap md:items-end md:gap-3">
            {/* 🔍 Main Search */}
            <div className="w-full md:w-[220px] relative">
              <label className="block text-white text-[12px] mb-1">Search</label>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search..."
                className="w-full px-4 py-2 text-sm text-white bg-white/[0.08] border border-white/[0.15] rounded-md focus:outline-none focus:ring-1 focus:ring-white/[0.25] placeholder:text-gray-400"
              />
            </div>

            {/* Mobile Collapse Button */}
            <button
              className="md:hidden text-white text-sm font-medium px-2 py-1 border border-white/20 rounded-md"
              onClick={() => setFiltersOpen(!filtersOpen)}
            >
              {filtersOpen ? "Hide Filters" : "Show Filters"}
            </button>

            
            {/* 3️⃣ Filters container: collapsible on mobile, always visible on md+ */}
            <div className={`${filtersOpen ? "flex" : "hidden"} flex-col md:flex md:flex-row md:gap-3 gap-4`}>

            {/* 👤 Author Dropdown */}
            <div ref={authorRef} className="w-full md:w-[220px] relative">
              <label className="block text-white text-[12px] mb-1">Author</label>
              <input
                type="text"
                value={authorSearch}
                onChange={(e) => {
                  setAuthorSearch(e.target.value);
                  setAuthorDropdownOpen(true);
                }}
                onFocus={() => setAuthorDropdownOpen(true)}
                placeholder="Type to search..."
                className="w-full px-2 py-2 text-sm text-white bg-white/[0.08] border border-white/[0.15] rounded-md focus:outline-none focus:ring-1 focus:ring-white/[0.25] placeholder:text-gray-400"
              />
              {authorDropdownOpen && (
                <div className="absolute top-full left-0 w-full mt-1 bg-black/80 border border-white/20 rounded-lg backdrop-blur-2xl shadow-[0_0_15px_rgba(0,0,0,0.4)] z-50 max-h-48 overflow-y-auto">
                  {uniqueAuthors
                    .filter((email) => email.toLowerCase().includes(authorSearch.toLowerCase()))
                    .map((email) => (
                      <div
                        key={email}
                        onClick={() => {
                          addToArray(selectedAuthors, setSelectedAuthors, email);
                          setAuthorSearch("");
                          setAuthorDropdownOpen(false);
                        }}
                        className="p-2 text-white text-sm hover:bg-white/20 cursor-pointer rounded-md transition"
                      >
                        {email}
                      </div>
                    ))}
                  {uniqueAuthors.filter((email) =>
                    email.toLowerCase().includes(authorSearch.toLowerCase())
                  ).length === 0 && (
                    <div className="p-2 text-gray-400 text-sm italic">No authors found</div>
                  )}
                </div>
              )}
            </div>

            {/* 🚦 Statuses Dropdown */}
            <div ref={statusesRef} className="w-full md:w-[220px] relative">
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
                  {Object.values(TAG_CATEGORY_STATUS)
                    .filter((s) => s.toLowerCase().includes(statusSearch.toLowerCase()))
                    .map((s) => (
                      <div
                        key={s}
                        onClick={() => {
                          addToArray(selectedStatuses, setSelectedStatuses, s, Object.values(TAG_CATEGORY_STATUS));
                          setStatusSearch("");
                          setStatusDropdownOpen(false);
                        }}
                        className="p-2 text-white text-sm hover:bg-white/20 cursor-pointer rounded-md transition"
                      >
                        {s.replace("_", " ").toUpperCase()}
                      </div>
                    ))}
                  {Object.values(TAG_CATEGORY_STATUS).filter((s) =>
                    s.toLowerCase().includes(statusSearch.toLowerCase())
                  ).length === 0 && (
                    <div className="p-2 text-gray-400 text-sm italic">No statuses found</div>
                  )}
                </div>
              )}
            </div>
                  {/* 📅 Created From */}
                  <div className="w-full md:w-[220px] relative">
                    <label className="block text-white text-[12px] mb-1">Created After</label>
                    <div className="relative">
                      <DatePicker
                        selected={createdFrom ? new Date(createdFrom) : null}
                        onChange={(date) => setCreatedFrom(date ? date.toISOString().split("T")[0] : "")}
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
                  <div className="w-full md:w-[220px] relative">
                    <label className="block text-white text-[12px] mb-1">Created Before</label>
                    <div className="relative">
                      <DatePicker
                        selected={createdTo ? new Date(createdTo) : null}
                        onChange={(date) => setCreatedTo(date ? date.toISOString().split("T")[0] : "")}
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
          </div>

           {/* Bottom Row: Pills + Clear Button */}
          {(selectedStatuses.length > 0 || selectedAuthors.length > 0) && (
            <div className="flex gap-3 items-start flex-wrap">
              {/* Selected Statuses */}
              {selectedStatuses.length > 0 && (
                <div className="w-fit max-w-[275px] flex-shrink-0 bg-white/[0.08] border border-dashed border-[rgba(145,158,171,0.2)] rounded-md p-2 min-h-[40px]">
                  <div className="flex flex-wrap gap-1">
                    {selectedStatuses.map((status) => (
                      <div
                        key={status}
                        className="flex items-center gap-1 bg-[rgba(255,255,255,0.1)] border border-[rgba(255,255,255,0.15)] rounded-[20px] h-[25px] px-2 py-1 text-[12px] text-[rgba(255,255,255,0.9)] max-w-[200px] whitespace-nowrap overflow-hidden text-ellipsis transition-all hover:bg-white/20"
                      >
                        <span className="truncate max-w-[60px]">{status}</span>
                        <button
                          onClick={() => removeFromArray(selectedStatuses, setSelectedStatuses, status)}
                          className="flex items-center justify-center w-[15px] h-[15px] rounded-full bg-white text-black text-[16px] cursor-pointer p-0 border-none hover:bg-gray-100 transition"
                          aria-label={`Remove status filter ${status}`}
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Selected Authors */}
              {selectedAuthors.length > 0 && (
                <div className="w-fit max-w-[275px] flex-shrink-0 bg-white/[0.08] border border-dashed border-[rgba(145,158,171,0.2)] rounded-md p-2 min-h-[40px]">
                  <div className="flex flex-wrap gap-1">
                    {selectedAuthors.map((author) => (
                      <div
                        key={author}
                        className="flex items-center gap-1 bg-[rgba(255,255,255,0.1)] border border-[rgba(255,255,255,0.15)] rounded-[20px] h-[25px] px-2 py-1 text-[12px] text-[rgba(255,255,255,0.9)] max-w-[200px] whitespace-nowrap overflow-hidden text-ellipsis transition-all hover:bg-white/20"
                      >
                        <span className="truncate max-w-[60px]">{author}</span>
                        <button
                          onClick={() => removeFromArray(selectedAuthors, setSelectedAuthors, author)}
                          className="flex items-center justify-center w-[15px] h-[15px] rounded-full bg-white text-black text-[16px] cursor-pointer p-0 border-none hover:bg-gray-100 transition"
                          aria-label={`Remove author filter ${author}`}
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
{/* Scrollable wrapper for header and cards */}
<div className="w-full overflow-x-auto md:overflow-x-visible">
        {/* Header Row (checkbox + labels for categories) */}
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
            <div className="flex flex-row items-center flex-1 gap-2 min-w-0">
              {/* Icon Placeholder */}
              <div className="w-2 h-10 bg-transparent" />

              {/* Category Name / Category Id Labels */}
              <div className="flex w-[340px] flex-col items-start shrink-0">
                <div className="text-left w-full">
                  <span className="text-white text-[14px] font-semibold">
                    Categories
                  </span>
                  <span className="text-[10px] text-[rgba(204,204,204,0.5)]">
                  </span>
                </div>
              </div>

              {/* Date / Send / Status Labels (gap-[120px], no role) */}
              <div className="flex flex-row gap-[120px] flex-1 min-w-0 items-center">
                <span className="text-white text-[14px] font-semibold min-w-[100px] text-center">
                  Date {/* FIXED: Date */}
                </span>
                <span className="text-white text-[14px] font-semibold min-w-[120px] text-center">
                  Author {/* FIXED: Send (for authorEmail) */}
                </span>
                <span className="text-white text-[14px] font-semibold min-w-[200px] text-center">
                  Status {/* FIXED: Status */}
                </span>
              </div>
            </div>
        </div>

        {/* Cards */}
        <div className="flex flex-col min-w-[1200px] items-center justify-start">
          {filteredData.length === 0 ? (
            <div className="text-gray-400 py-10 text-center text-sm">
              No category requests found matching filters. {/* FIXED: category requests */}
            </div>
          ) : (
            paginatedData.map((request) => (
                <CategoryCard
                key={request.id}
                id={request.id}
                category_name={request.category_name} 
                user_id={request.user_id} // Keep for reference if needed
                status={request.status as TAG_CATEGORY_STATUS}
                created_at={request.created_at}
                authorEmail={request.authorEmail} // NEW: Pass email from API/hook
                isSelected={selectedIds.includes(request.id)}
                onSelect={handleSelect} // FIXED: Selection handler
                onApprove={() => handleApprove(request.id)} // FIXED: approveCategory via handler
                onReject={() => handleReject(request.id)} // FIXED: rejectCategory via handler
              />
            ))
          )}
        </div>

        </div>

{/* Footer */}
        <div className="flex flex-col sm:flex-row items-center justify-between w-full border-t border-[rgba(145,158,171,0.2)] py-3 px-5 bg-white/[0.05] gap-3">
  {/* Bulk Actions (left – approve/reject for categories) */}
          <div className="flex items-center gap-2 flex-wrap justify-center sm:justify-start">
        
              <span className="text-white text-[12px] opacity-80">
                {selectedIds.length} category{selectedIds.length !== 1 ? "s" : ""} selected {/* FIXED: category request */}
              </span>
          
            {selectedIds.length > 0 && (
                    <>
                     <button
                        onClick={bulkApproveSelected}
                        className="relative w-[120px] h-[30px] rounded-full bg-white/[0.05] border border-white/10 shadow-[inset_0_0_4px_rgba(239,214,255,0.25)] backdrop-blur-[10px] text-white font-bold text-sm flex items-center justify-center transition hover:scale-[1.02] overflow-hidden"
                      >
                         <span className="absolute inset-0 rounded-full bg-[radial-gradient(circle,rgba(119,237,139,0.5)_0%,transparent_70%)] blur-md" />
                      <span className="relative z-10">Approve</span>
                     
                      </button>
                      <button
                        onClick={bulkRejectSelected}
                        className="relative w-[120px] h-[30px] rounded-full bg-white/[0.05] border border-white/10 shadow-[inset_0_0_4px_rgba(239,214,255,0.25)] backdrop-blur-[10px] text-white font-bold text-sm flex items-center justify-center transition hover:scale-[1.02] overflow-hidden"
                      >
                         <span className="absolute inset-0 rounded-full bg-[radial-gradient(circle,rgba(255,99,99,0.5)_0%,transparent_70%)] blur-md" />
                      <span className="relative z-10">Reject</span>
                       
                      </button>
                      <button
                        onClick={() => setSelectedIds([])}
                        className="relative w-[120px] h-[30px] rounded-full  border border-white/10  text-white font-bold text-sm flex items-center justify-center transition hover:scale-[1.02] overflow-hidden"
                      >
                         <span className="absolute inset-0 rounded-full bg-black blur-md" />
                      <span className="relative z-10">Unselect All</span>
                        
                      </button>
                    </>
                  )}
          </div>

  {/* Pagination (right) */}
  <div className="flex items-center gap-2 flex-wrap justify-center sm:justify-end mt-2 sm:mt-0">
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
                 <span className="ml-2  text-[10px]">
                    <svg width="12" height="6" viewBox="0 0 12 6" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M5.8344 5.8344C5.63969 5.83478 5.45099 5.76696 5.30106 5.64273L0.301063 1.47606C-0.0533202 1.18151 -0.101823 0.655445 0.192729 0.301062C0.487281 -0.0533202 1.01335 -0.101823 1.36773 0.192729L5.8344 3.92606L10.3011 0.326063C10.4732 0.186254 10.694 0.120838 10.9145 0.1443C11.1351 0.167761 11.3372 0.278163 11.4761 0.451063C11.6303 0.624279 11.7054 0.85396 11.6833 1.08486C11.6612 1.31576 11.5438 1.52699 11.3594 1.66773L6.3594 5.69273C6.20516 5.79733 6.02031 5.8472 5.8344 5.8344Z" fill="white"/>
                    </svg>
                  </span>
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

            {/* Navigation Buttons (<< < > >>) */}
                       <div className="flex items-center gap-2">
                         {/* First Page */}
                         <button
                           onClick={goToPreviousPage}
                           disabled={currentPage === 1 || totalPages === 0}
                           className={`w-8 h-8 flex items-center justify-center rounded-[6px] transition-all
                             ${currentPage === 1 || totalPages === 0
                               ? "opacity-40 cursor-not-allowed"
                               : "hover:bg-white/[0.08] hover:backdrop-blur-sm cursor-pointer"
                             }`}
                           aria-label="First page"
                         >
                           <Image
                             src="/left1.svg"
                             alt="First page"
                             width={6}
                             height={6}
                             className="opacity-90"
                           />
                         </button>
           
                         {/* Previous Page */}
                         <button
                           onClick={goToFirstPage}
                           disabled={currentPage === 1 || totalPages === 0}
                           className={`w-8 h-8 flex items-center justify-center rounded-[6px] transition-all
                             ${currentPage === 1 || totalPages === 0
                               ? "opacity-40 cursor-not-allowed"
                               : "hover:bg-white/[0.08] hover:backdrop-blur-sm cursor-pointer"
                             }`}
                           aria-label="Previous page"
                         >
                           <Image
                             src="/left2.svg"
                             alt="Previous page"
                             width={10}
                             height={10}
                             className="opacity-90"
                           />
                         </button>
           
                         {/* Next Page */}
                         <button
                           onClick={goToLastPage}
                           disabled={currentPage === totalPages || totalPages === 0}
                           className={`w-8 h-8 flex items-center justify-center rounded-[6px] transition-all
                             ${currentPage === totalPages || totalPages === 0
                               ? "opacity-40 cursor-not-allowed"
                               : "hover:bg-white/[0.08] hover:backdrop-blur-sm cursor-pointer"
                             }`}
                           aria-label="Next page"
                         >
                           <Image
                             src="/right2.svg"
                             alt="Next page"
                             width={10}
                             height={10}
                             className="opacity-90"
                           />
                         </button>
           
                         {/* Last Page */}
                         <button
                           onClick={goToNextPage}
                           disabled={currentPage === totalPages || totalPages === 0}
                           className={`w-8 h-8 flex items-center justify-center rounded-[6px] transition-all
                             ${currentPage === totalPages || totalPages === 0
                               ? "opacity-40 cursor-not-allowed"
                               : "hover:bg-white/[0.08] hover:backdrop-blur-sm cursor-pointer"
                             }`}
                           aria-label="Last page"
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
    </>
  );
}