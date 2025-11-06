"use client";

import { useState, useEffect, useMemo } from "react";
import UserCard from "./UserCard";
import { useUsers } from "@/hooks/useUsers"; // NEW: Custom hook for admin users API

import { USER_ROLES, USER_STATUS } from "@/lib/enums";
import Image from "next/image";
import CategoryGridSkeleton from "./CategoryGridSkeleton";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css"; 

export default function UserGrid() {
  const { users, loading, error, refetch, deleteUser } = useUsers(); // NEW: Hook fetches from /api/admin/users

  const [roleDropdownOpen, setRoleDropdownOpen] = useState(false);
  const [roleSearch, setRoleSearch] = useState("");
  const [statusDropdownOpen, setStatusDropdownOpen] = useState(false);
  const [statusSearch, setStatusSearch] = useState("");
  const [rowsDropdownOpen, setRowsDropdownOpen] = useState(false);

  // Filters (client-side)
  const [search, setSearch] = useState("");
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]); // NEW: Multi-select array for statuses
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]); // NEW: Multi-select array for roles

  // NEW: Date filters
  const [createdFrom, setCreatedFrom] = useState<string>(""); // ISO date string (e.g., "2023-01-01")
  const [createdTo, setCreatedTo] = useState<string>(""); // ISO date string (e.g., "2023-12-31")

  // Selection + Pagination
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);

  /** 🧠 Client-side filtering (updated for multi-select arrays and dates) */
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

    // 📅 Date range filter (created_at – assumes ISO string; inclusive)
if (createdFrom || createdTo) {
  filtered = filtered.filter((item) => {
    if (!item.created_at) return false; // Skip if no date
    const itemDate = new Date(item.created_at); // Parse created_at (ISO string)
    const fromDate = createdFrom ? new Date(createdFrom) : null;
    const toDate = createdTo ? new Date(createdTo) : null;
    if (fromDate && itemDate < fromDate) return false;
    if (toDate && itemDate > toDate) return false;
    return true;
  });
}
    return filtered;
  }, [users, search, selectedStatuses, selectedRoles, createdFrom, createdTo]); // FIXED: Deps include new date filters

  /** Pagination */
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const paginatedData = filteredData.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Reset page on filter change
  useEffect(() => {
    setCurrentPage(1);
  }, [search, selectedStatuses, selectedRoles, createdFrom, createdTo]); // Include new date filters

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

  // Clear all (both roles, statuses, and dates)
  const clearAllFilters = () => {
    setSelectedRoles([]);
    setSelectedStatuses([]);
    setCreatedFrom("");
    setCreatedTo("");
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
      <div className="flex justify-center text-gray-400 text-lg">
        <CategoryGridSkeleton />
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
          overflow: "visible",
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
          {/* Horizontal Row: Main Search + Filters (Fixed, no movement) */}
          <div className="flex flex-wrap items-end gap-3 mb-3">
            {/* 🔍 Main Search Input - Reduced Width */}
            <div className="flex-1 min-w-[200px]">
              <label className="block text-white text-[12px] mb-1">Search</label>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by email or ID..."
                className="w-full px-4 py-2 text-sm text-white bg-white/[0.08] border border-white/[0.15] rounded-md focus:outline-none focus:ring-1 focus:ring-white/[0.25] placeholder:text-gray-400"
              />
            </div>

            {/* 🎭 Roles (Category) Dropdown */}
            <div className="w-[220px] relative">
              <label className="block text-white text-[12px] mb-1">Roles</label>
              {/* Search Input */}
              <input
                type="text"
                placeholder="Type to search roles..."
                value={roleSearch || ""}
                onChange={(e) => {
                  setRoleSearch(e.target.value);
                  setRoleDropdownOpen(true);
                }}
                onFocus={() => setRoleDropdownOpen(true)}
                className="w-full px-2 py-2 text-sm text-white bg-white/[0.08] border border-white/[0.15] rounded-md focus:outline-none focus:ring-1 focus:ring-white/[0.25] placeholder:text-gray-400"
              />
              {/* Separate Results Box */}
              {roleDropdownOpen && (
                <div className="absolute top-full left-0 w-full mt-1 bg-black/80 border border-white/20 rounded-lg backdrop-blur-2xl shadow-[0_0_15px_rgba(0,0,0,0.4)] z-50 max-h-48 overflow-y-auto">
                  {Object.values(USER_ROLES)
                    .filter((role) => role.toLowerCase().includes(roleSearch.toLowerCase()))
                    .map((role) => (
                      <div
                        key={role}
                        onClick={() => {
                          addToArray(selectedRoles, setSelectedRoles, role, Object.values(USER_ROLES));
                          setRoleSearch("");
                          setRoleDropdownOpen(false);
                        }}
                        className="p-2 text-white text-sm hover:bg-white/20 cursor-pointer rounded-md transition"
                      >
                        {role}
                      </div>
                    ))}
                  {Object.values(USER_ROLES).filter((role) =>
                    role.toLowerCase().includes(roleSearch.toLowerCase())
                  ).length === 0 && (
                    <div className="p-2 text-gray-400 text-sm italic">No roles found</div>
                  )}
                </div>
              )}
            </div>

            {/* 🚦 Statuses Dropdown */}
            <div className="w-[220px] relative">
              <label className="block text-white text-[12px] mb-1">Statuses</label>
              {/* Search Input */}
              <input
                type="text"
                placeholder="Type to search statuses..."
                value={statusSearch || ""}
                onChange={(e) => {
                  setStatusSearch(e.target.value);
                  setStatusDropdownOpen(true);
                }}
                onFocus={() => setStatusDropdownOpen(true)}
                className="w-full px-2 py-2 text-sm text-white bg-white/[0.08] border border-white/[0.15] rounded-md focus:outline-none focus:ring-1 focus:ring-white/[0.25] placeholder:text-gray-400"
              />
              {/* Separate Results Box */}
              {statusDropdownOpen && (
                <div className="absolute top-full left-0 w-full mt-1 bg-black/80 border border-white/20 rounded-lg backdrop-blur-2xl shadow-[0_0_15px_rgba(0,0,0,0.4)] z-50 max-h-48 overflow-y-auto">
                  {Object.values(USER_STATUS)
                    .filter((status) =>
                      status.toLowerCase().includes(statusSearch.toLowerCase())
                    )
                    .map((status) => (
                      <div
                        key={status}
                        onClick={() => {
                          addToArray(selectedStatuses, setSelectedStatuses, status, Object.values(USER_STATUS));
                          setStatusSearch("");
                          setStatusDropdownOpen(false);
                        }}
                        className="p-2 text-white text-sm hover:bg-white/20 cursor-pointer rounded-md transition"
                      >
                        {status}
                      </div>
                    ))}
                  {Object.values(USER_STATUS).filter((status) =>
                    status.toLowerCase().includes(statusSearch.toLowerCase())
                  ).length === 0 && (
                    <div className="p-2 text-gray-400 text-sm italic">No statuses found</div>
                  )}
                </div>
              )}
            </div>
             {/* 📅 Created From */}
          <div className="w-[150px]">
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
          <div className="w-[150px]">
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
          
  {/* New Horizontal Row: Selected Pills Boxes (Appears below, fixed position) */}
{(selectedRoles.length > 0 || selectedStatuses.length > 0) && (
  <div className="flex gap-3 items-start">
    {/* Selected Roles Pills Box */}
    {selectedRoles.length > 0 && (
      <div className="w-fit max-w-[260px] flex-shrink-0 bg-white/[0.08] border border-dashed border-[rgba(145,158,171,0.2)] rounded-md p-2 min-h-[40px]">
        <div className="flex flex-wrap gap-1">
          {selectedRoles.map((role) => (
            <div
              key={role}
              className="flex items-center gap-1 bg-[rgba(255,255,255,0.1)] border border-[rgba(255,255,255,0.15)] rounded-[20px] h-[25px] px-2 py-1 text-[12px] text-[rgba(255,255,255,0.9)] max-w-[200px] whitespace-nowrap overflow-hidden text-ellipsis transition-all hover:bg-white/20"
            >
              <span className="truncate max-w-[60px]">{role}</span>
              <button
                onClick={() => removeFromArray(selectedRoles, setSelectedRoles, role)}
                className="flex items-center justify-center w-[15px] h-[15px] rounded-full bg-white text-black text-[16px] cursor-pointer p-0 border-none hover:bg-gray-100 transition"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      </div>
    )}

    {/* Selected Statuses Pills Box */}
    {selectedStatuses.length > 0 && (
      <div className="flex-shrink-0 bg-white/[0.08] border border-dashed border-[rgba(145,158,171,0.2)] rounded-md p-2 min-h-[40px] w-fit max-w-[260px]">
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
    <button
        onClick={clearAllFilters}
        className="flex items-center gap-1 text-red-500 hover:text-red-600 text-sm font-medium transition-all mt-2"
      >
        <Image
          src="/redtrash.svg"
          alt="Logout Icon"
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
            <div className="flex w-[370px] flex-col items-start gap-2 shrink-0">
              <div className="text-left w-full">
                <span className="text-white text-[14px] font-semibold">
                  User
                </span>
            
              </div>
            </div>

            {/* Date / Role / Status / Full Email Labels */}
            <div className="flex flex-row gap-[100px] flex-1 min-w-0 items-center">
              <span className="text-white text-[14px] font-semibold min-w-[100px] text-center">
                Date Created
              </span>
              <span className="text-white text-[14px] font-semibold min-w-[100px] text-center">
                Role
              </span>
              <span className="text-white text-[14px] font-semibold min-w-[120px] text-center">
                Status
              </span>
            </div>
          </div>
        </div>

        {/* Cards */}
        <div className="flex flex-col w-full items-center justify-start">

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

              <span className="text-white text-[12px] opacity-80">
                {selectedIds.length} user{selectedIds.length !== 1 ? "s" : ""} selected
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
