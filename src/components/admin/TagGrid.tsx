"use client";

import { useState, useEffect, useMemo } from "react";
import TagCard from "./TagCard"; // NEW: Use TagCard instead of UserCard
import { useAdminTags } from "@/hooks/useAdminTags"; // NEW: Use tag requests hook
import { TAG_CATEGORY_STATUS } from "@/lib/enums"; // NEW: For tag status (no roles)
import Image from "next/image";
import CategoryGridSkeleton from "./CategoryGridSkeleton";
export default function TagGrid() {
  const { requests, loading, error, refetch, approveTag, rejectTag } = useAdminTags(); // NEW: Hook for tag requests

  // Filters (client-side – status only, no roles for tags)
  const [search, setSearch] = useState("");
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]); // NEW: Multi-select for statuses only

  const [statusSearch, setStatusSearch] = useState("");
  const [statusDropdownOpen, setStatusDropdownOpen] = useState(false);
  const [rowsDropdownOpen, setRowsDropdownOpen] = useState(false);

  // Selection + Pagination
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);

  /** 🧠 Client-side filtering (status only, search by tag_name or user_id) */
  const filteredData = useMemo(() => {
    let filtered = requests || [];

    // 🔍 Search filter (tag_name or user_id)
    if (search.trim()) {
      const query = search.toLowerCase();
      filtered = filtered.filter(
        (item) =>
          item.tag_name?.toLowerCase().includes(query) ||
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

    return filtered;
  }, [requests, search, selectedStatuses]); // FIXED: Deps include array

  /** Pagination */
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const paginatedData = filteredData.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Reset page on filter change
  useEffect(() => {
    setCurrentPage(1);
  }, [search, selectedStatuses]);

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

  // Clear all (statuses only)
  const clearAllFilters = () => {
    setSelectedStatuses([]);
  };

  /// Handle keydown for adding (Enter, comma)
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
    await approveTag(id);
    setSelectedIds((prev) => prev.filter((s) => s !== id)); // Remove from selection
    window.location.reload(); // FIXED: Silent reload for fresh data (updates status/UI)
  } catch (err: unknown) {
    console.error("Approve error:", err); // Silent log (no alert)
  }
};

const handleReject = async (id: string) => {
  try {
    await rejectTag(id);
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
      await approveTag(id); // Calls hook (DB update)
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
      await rejectTag(id); // Calls hook (DB update)
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
        No tag requests available.
      </div>
    );

  /** Render UI */
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
        {/* 🧠 Stats Summary (counts from filtered data – tag statuses) */}
        <div className="flex flex-wrap gap-4 w-full px-5 py-4 border-b border-[rgba(145,158,171,0.2)] bg-white/[0.05]">
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
        <div className="flex flex-wrap items-end gap-3 mb-3">
          {/* 🔍 Main Search */}
          <div className="flex-1 min-w-[200px]">
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
          <div className="w-[220px] relative">
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
      
        </div>
      
        {/* Bottom Row: Pills + Clear Button */}
        {(selectedStatuses.length > 0) && (
          <div className="flex gap-3 items-start">
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
          <div className="flex flex-row items-center flex-1 gap-2 min-w-0">
            {/* Icon Placeholder */}
            <div className="w-2 h-10 bg-transparent" />

            {/* Tag Name / User ID Labels */}
            <div className="flex w-[340px] flex-col items-start gap-2 shrink-0">
              <div className="text-left w-full">
                <span className="text-white text-[14px] font-semibold">
                  Tags
                </span>
                <span className="text-[10px] text-[rgba(204,204,204,0.5)]">
                </span>
              </div>
            </div>

            {/* Date / Status / Full Tag Name Labels (gap-[100px], no role) */}
            <div className="flex flex-row gap-[120px] flex-1 min-w-0 items-center">
              <span className="text-white text-[14px] font-semibold min-w-[100px] text-center">
                Date
              </span>
              <span className="text-white text-[14px] font-semibold min-w-[120px] text-center">
                Send
              </span>
              <span className="text-white text-[14px] font-semibold min-w-[200px] text-center">
                Status
              </span>
            </div>
          </div>
        </div>

        {/* Cards */}
        <div className="flex flex-col w-full items-center justify-start">
          {filteredData.length === 0 ? (
            <div className="text-gray-400 py-10 text-center text-sm">
              No tag requests found matching filters.
            </div>
          ) : (
            paginatedData.map((request) => (
              <TagCard
                    key={request.id}
                    id={request.id}
                    tag_name={request.tag_name}
                    user_id={request.user_id} // Keep for reference if needed
                    status={request.status as TAG_CATEGORY_STATUS}
                    created_at={request.created_at}
                    authorEmail={request.authorEmail} // NEW: Pass email from API/hook
                    isSelected={selectedIds.includes(request.id)}
                    onSelect={handleSelect}
                    onApprove={() => handleApprove(request.id)}
                    onReject={() => handleReject(request.id)}
                />
            ))
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between w-full border-t border-[rgba(145,158,171,0.2)] py-3 px-5 bg-white/[0.05]">
          {/* Bulk Actions (left – approve/reject/delete for tags) */}
          <div className="flex items-center gap-3">
            
              <span className="text-white text-[12px] opacity-80">
                {selectedIds.length} tag{selectedIds.length !== 1 ? "s" : ""} selected
              </span>

            {selectedIds.length > 0 && (
              <>
               <button
                  onClick={bulkApproveSelected}
                  className="relative w-[150px] h-[30px] rounded-full bg-white/[0.05] border border-white/10 shadow-[inset_0_0_4px_rgba(239,214,255,0.25)] backdrop-blur-[10px] text-white font-bold text-sm flex items-center justify-center transition hover:scale-[1.02] overflow-hidden"
                >
                   <span className="absolute inset-0 rounded-full bg-[radial-gradient(circle,rgba(119,237,139,0.5)_0%,transparent_70%)] blur-md" />
                <span className="relative z-10">Approve Selected</span>
               
                </button>
                <button
                  onClick={bulkRejectSelected}
                  className="relative w-[150px] h-[30px] rounded-full bg-white/[0.05] border border-white/10 shadow-[inset_0_0_4px_rgba(239,214,255,0.25)] backdrop-blur-[10px] text-white font-bold text-sm flex items-center justify-center transition hover:scale-[1.02] overflow-hidden"
                >
                   <span className="absolute inset-0 rounded-full bg-[radial-gradient(circle,rgba(255,99,99,0.5)_0%,transparent_70%)] blur-md" />
                <span className="relative z-10">Reject Selected</span>
                 
                </button>
                <button
                  onClick={() => setSelectedIds([])}
                  className="relative w-[150px] h-[30px] rounded-full bg-white/[0.05] border border-white/10 shadow-[inset_0_0_4px_rgba(239,214,255,0.25)] backdrop-blur-[10px] text-white font-bold text-sm flex items-center justify-center transition hover:scale-[1.02] overflow-hidden"
                >
                   <span className="absolute inset-0 rounded-full bg-[radial-gradient(circle,rgba(255,99,99,0.5)_0%,transparent_70%)] blur-md" />
                <span className="relative z-10">Unselect All</span>
                  
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
