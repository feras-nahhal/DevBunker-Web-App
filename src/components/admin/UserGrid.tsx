"use client";

import { useState, useEffect, useMemo } from "react";
import UserCard from "./UserCard";
import { useUsers } from "@/hooks/useUsers"; // NEW: Custom hook for admin users API
import { useAuth } from "@/hooks/useAuth";
import { USER_ROLES, USER_STATUS } from "@/lib/enums";


export default function UserGrid() {
  const { users, loading, error, refetch, deleteUser } = useUsers(); // NEW: Hook fetches from /api/admin/users
  const { user: authUser } = useAuth(); // Optional: For current user checks

  // Filters (client-side)
  const [search, setSearch] = useState("");
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]); // NEW: Multi-select array for statuses
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]); // NEW: Multi-select array for roles

  // Selection + Pagination
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);


  /** 🧠 Client-side filtering (updated for multi-select arrays) */
  const filteredData = useMemo(() => {
    let filtered = users || [];

    // 🔍 Search filter (email or ID)
    if (search.trim()) {
      const query = search.toLowerCase();
      filtered = filtered.filter(
        (item) =>
          item.email?.toLowerCase().includes(query) ||
          item.id?.toLowerCase().includes(query)
      );
    }

    // ⚙️ Multi-status filter (partial match on array)
    if (selectedStatuses.length > 0) {
      filtered = filtered.filter((item) =>
        selectedStatuses.some((status) =>
          item.status.toLowerCase().includes(status.toLowerCase())
        )
      );
    }

    // 🎭 Multi-role filter (partial match on array)
    if (selectedRoles.length > 0) {
      filtered = filtered.filter((item) =>
        selectedRoles.some((role) =>
          item.role.toLowerCase().includes(role.toLowerCase())
        )
      );
    }

    return filtered;
  }, [users, search, selectedStatuses, selectedRoles]); // FIXED: Deps include arrays

  /** Pagination */
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const paginatedData = filteredData.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Reset page on filter change
  useEffect(() => {
    setCurrentPage(1);
  }, [search, selectedStatuses, selectedRoles]);

  /** NEW: Pill Multi-Select Handlers */
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

  // Clear all (both roles and statuses)
  const clearAllFilters = () => {
    setSelectedRoles([]);
    setSelectedStatuses([]);
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


  /** Delete handlers (uses hook's deleteUser) */
  const handleDelete = async (id: string) => {
    try {
      await deleteUser(id);
      setSelectedIds((prev) => prev.filter((s) => s !== id)); // Remove from selection
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Failed to delete user.";
      alert(errorMessage);
    }

  };

  const handleDeleteSelected = async () => {
    if (!selectedIds.length) return;
    try {
      for (const id of selectedIds) {
        await deleteUser(id);
      }
      setSelectedIds([]);
      alert(`${selectedIds.length} users deleted successfully.`);
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error ? err.message : "Error deleting selected users.";
      alert(errorMessage);
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
        : filteredData.map((u) => u.id)
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
      <div className="flex justify-center py-10 text-gray-400 text-lg">
        Loading users...
      </div>
    );

  if (error)
    return (
      <div className="flex justify-center py-10 text-red-500">
        Error: {error}
      </div>
    );

  if (!users || users.length === 0)
    return (
      <div className="flex justify-center py-10 text-gray-400">
        No users available.
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
          overflow: "hidden",
        }}
      >
        {/* 🧠 Stats Summary (counts from filtered data) */}
        <div className="flex flex-wrap gap-4 w-full px-5 py-4 border-b border-[rgba(145,158,171,0.2)] bg-white/[0.05]">
          {[
            { label: "All", color: "#9CA3AF", count: filteredData.length },
            {
              label: "Active",
              color: "rgba(34, 197, 94, 0.16)",
              count: filteredData.filter((u) => u.status === USER_STATUS.ACTIVE).length,
            },
            {
              label: "Pending",
              color: "rgba(255, 171, 0, 0.16)",
              count: filteredData.filter((u) => u.status === USER_STATUS.PENDING).length,
            },
            {
              label: "Banned",
              color: "rgba(255,86,48,0.16)",
              count: filteredData.filter((u) => u.status === USER_STATUS.BANNED).length,
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
          {/* Search Input (single, full width) */}
          <div className="w-full mb-3">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="🔍 Search by email or ID..."
              className="w-full px-4 py-2 text-sm text-white bg-white/[0.08] border border-white/[0.15] rounded-md focus:outline-none focus:ring-1 focus:ring-white/[0.25] placeholder:text-gray-400"
            />
          </div>

          {/* NEW: Multi-Select Filters Row (fixed size boxes + clear all right) */}
          <div className="flex items-center gap-3">
            {/* Role Multi-Select (fixed w-[200px], pills inside, input dynamic right) */}
            <div className="w-[200px]">
              <label className="block text-white text-[12px] mb-1">Roles</label>
              <div className="relative bg-white/[0.08] border border-dashed border-[rgba(145,158,171,0.2)] rounded-md p-2 focus-within:ring-1 focus-within:ring-white/[0.25] min-h-[40px] h-auto">
                {/* Pills (left, wrap/expand container height) */}
                <div className="flex flex-wrap gap-1 mb-1">
                  {selectedRoles.map((role) => (
                    <div
                      key={role}
                      className="inline-flex items-center px-1.5 py-0.5 rounded-full bg-white/[0.1] border border-dashed border-[rgba(145,158,171,0.2)] text-white text-[10px] hover:bg-white/[0.2] transition-all"
                    >
                      <span className="truncate max-w-[60px]">{role}</span>
                      <button
                        onClick={() => removeFromArray(selectedRoles, setSelectedRoles, role)}
                        className="ml-0.5 w-3 h-3 flex items-center justify-center rounded-full bg-red-500 hover:bg-red-400 text-white text-[8px] transition-all"
                        aria-label={`Remove role ${role}`}
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
                {/* Input (dynamic right, fixed small width, ml-auto) */}
                <input
                  type="text"
                  placeholder={selectedRoles.length > 0 ? "" : "Type roles..."}
                  onKeyDown={(e) => handleKeyDown(e, (value: string) => addToArray(selectedRoles, setSelectedRoles, value, Object.values(USER_ROLES)))}
                  onBlur={(e) => handleBlur(e, (value: string) => addToArray(selectedRoles, setSelectedRoles, value, Object.values(USER_ROLES)))}
                  className="ml-auto px-2 py-1 text-sm text-white bg-transparent border-none outline-none placeholder:text-gray-400 placeholder:opacity-50 w-[80px] flex-shrink-0"
                />
              </div>
            </div>

            {/* Status Multi-Select (fixed w-[200px], symmetric) */}
            <div className="w-[200px]">
              <label className="block text-white text-[12px] mb-1">Statuses</label>
              <div className="relative bg-white/[0.08] border border-dashed border-[rgba(145,158,171,0.2)] rounded-md p-2 focus-within:ring-1 focus-within:ring-white/[0.25] min-h-[40px] h-auto">
                {/* Pills (left, wrap/expand container height) */}
                <div className="flex flex-wrap gap-1 mb-1">
                  {selectedStatuses.map((status) => (
                    <div
                      key={status}
                      className="inline-flex items-center px-1.5 py-0.5 rounded-full bg-white/[0.1] border border-dashed border-[rgba(145,158,171,0.2)] text-white text-[10px] hover:bg-white/[0.2] transition-all"
                    >
                      <span className="truncate max-w-[60px]">{status}</span>
                      <button
                        onClick={() => removeFromArray(selectedStatuses, setSelectedStatuses, status)}
                        className="ml-0.5 w-3 h-3 flex items-center justify-center rounded-full bg-red-500 hover:bg-red-400 text-white text-[8px] transition-all"
                        aria-label={`Remove status ${status}`}
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
                {/* Input (dynamic right, fixed small width, ml-auto) */}
                <input
                  type="text"
                  placeholder={selectedStatuses.length > 0 ? "" : "Type statuses..."}
                  onKeyDown={(e) => handleKeyDown(e, (value: string) => addToArray(selectedStatuses, setSelectedStatuses, value, Object.values(USER_STATUS)))}
                  onBlur={(e) => handleBlur(e, (value: string) => addToArray(selectedStatuses, setSelectedStatuses, value, Object.values(USER_STATUS)))}
                  className="ml-auto px-2 py-1 text-sm text-white bg-transparent border-none outline-none placeholder:text-gray-400 placeholder:opacity-50 w-[80px] flex-shrink-0"
                />
              </div>
            </div>

            {/* NEW: Single Clear All Button (trash icon, right side, clears both) */}
            {(selectedRoles.length > 0 || selectedStatuses.length > 0) && (
              <button
                onClick={clearAllFilters}
                className="ml-auto px-3 py-2 bg-red-500/80 hover:bg-red-600 text-white text-[12px] rounded-md transition-all flex items-center gap-1"
                aria-label="Clear all filters"
              >
                🗑️ Clear All
              </button>
            )}
          </div>
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

          {/* Labels */}
          <div className="flex flex-row items-center flex-1 gap-12 min-w-0">
            {/* Avatar Placeholder */}
            <div className="w-10 h-10 bg-transparent" />

            {/* Email / User ID Labels */}
            <div className="flex w-[370px] flex-col items-start gap-2 shrink-0">
              <div className="text-left w-full">
                <span className="text-white text-[12px] font-semibold">
                  Email
                </span>
                <span className="text-[10px] text-[rgba(204,204,204,0.5)]">
                  User ID
                </span>
              </div>
            </div>

            {/* Date / Role / Status / Full Email Labels */}
            <div className="flex flex-row gap-[100px] flex-1 min-w-0 items-center">
              <span className="text-white text-[12px] font-semibold min-w-[100px] text-center">
                Date Created
              </span>
              <span className="text-white text-[12px] font-semibold min-w-[100px] text-center">
                Role
              </span>
              <span className="text-white text-[12px] font-semibold min-w-[120px] text-center">
                Status
              </span>
              <span className="text-white text-[12px] font-semibold min-w-[200px] text-center">
                Full Email
              </span>
            </div>
          </div>
        </div>

        {/* Cards */}
        <div className="flex flex-col w-full min-h-[200px] justify-center items-center">
          {filteredData.length === 0 ? (
            <div className="text-gray-400 py-10 text-center text-sm">
              No users found matching filters.
            </div>
          ) : (
            paginatedData.map((user) => (
              <UserCard
                key={user.id}
                id={user.id}
                email={user.email}
                role={user.role}
                status={user.status}
                created_at={user.created_at}
                isSelected={selectedIds.includes(user.id)}
                onSelect={handleSelect}
                onDelete={() => handleDelete(user.id)}
              />
            ))
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between w-full border-t border-[rgba(145,158,171,0.2)] py-3 px-5 bg-white/[0.05]">
          {/* Bulk Actions (left) */}
          <div className="flex items-center gap-3">
            {selectedIds.length > 0 && (
              <span className="text-white text-[12px] opacity-80">
                {selectedIds.length} user{selectedIds.length !== 1 ? "s" : ""} selected
              </span>
            )}
            {selectedIds.length > 0 && (
              <>
                <button
                  onClick={handleDeleteSelected}
                  className="px-3 py-1 bg-red-500/80 hover:bg-red-600 text-white text-[12px] rounded-md transition-all"
                >
                  🗑️ Delete Selected
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

          {/* Pagination (right) */}
          <div className="flex items-center gap-3">
            {/* Rows per page */}
            <div className="flex items-center gap-2">
              <span className="text-[12px] text-gray-300">Rows per page:</span>
              <input
                type="number"
                min={1}
                max={filteredData.length}
                value={itemsPerPage}
                onChange={(e) => {
                  const val = Math.max(1, Math.min(Number(e.target.value) || 1, filteredData.length));
                  setItemsPerPage(val);
                  setCurrentPage(1);
                }}
                className="bg-white/[0.1] text-white text-[12px] px-2 py-1 w-14 rounded-md outline-none hover:bg-white/[0.2] transition-all text-center focus:ring-1 focus:ring-green-400"
              />
            </div>

            {/* Page info */}
            <span className="text-white text-[12px] text-center min-w-[100px]">
              Page {totalPages > 0 ? currentPage : 0} of {totalPages} ({filteredData.length} total)
            </span>

            {/* Navigation Buttons (<< < > >>) */}
            <div className="flex items-center gap-2">
              <button
                onClick={goToFirstPage}
                disabled={currentPage === 1 || totalPages === 0}
                className={`w-8 h-8 flex items-center justify-center rounded-[6px] text-white transition-all ${
                  currentPage === 1 || totalPages === 0
                    ? "bg-gray-600 cursor-not-allowed opacity-50"
                    : "bg-white/[0.1] hover:bg-white/[0.2] cursor-pointer"
                }`}
                aria-label="First page"
              >
                &lt;&lt;
              </button>
              <button
                onClick={goToPreviousPage}
                disabled={currentPage === 1 || totalPages === 0}
                className={`w-8 h-8 flex items-center justify-center rounded-[6px] text-white transition-all ${
                  currentPage === 1 || totalPages === 0
                    ? "bg-gray-600 cursor-not-allowed opacity-50"
                    : "bg-white/[0.1] hover:bg-white/[0.2] cursor-pointer"
                }`}
                aria-label="Previous page"
              >
                &lt;
              </button>
              <button
                onClick={goToNextPage}
                disabled={currentPage === totalPages || totalPages === 0}
                className={`w-8 h-8 flex items-center justify-center rounded-[6px] text-white transition-all ${
                  currentPage === totalPages || totalPages === 0
                    ? "bg-gray-600 cursor-not-allowed opacity-50"
                    : "bg-white/[0.1] hover:bg-white/[0.2] cursor-pointer"
                }`}
                aria-label="Next page"
              >
                &gt;
              </button>
              <button
                onClick={goToLastPage}
                disabled={currentPage === totalPages || totalPages === 0}
                className={`w-8 h-8 flex items-center justify-center rounded-[6px] text-white transition-all ${
                  currentPage === totalPages || totalPages === 0
                    ? "bg-gray-600 cursor-not-allowed opacity-50"
                    : "bg-white/[0.1] hover:bg-white/[0.2] cursor-pointer"
                }`}
                aria-label="Last page"
              >
                &gt;&gt;
              </button>
            </div>
          </div>
        </div>
      </div>

 
    </>
  );
}
