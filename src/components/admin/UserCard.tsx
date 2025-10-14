"use client";

import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import { USER_ROLES, USER_STATUS } from "@/lib/enums"; // For role/status badges

interface UserCardProps {
  id: string;
  email: string; // Email (used as title/name)
  role: USER_ROLES; // Role (for column/badge)
  status: USER_STATUS; // Status (for badge)
  created_at?: string; // Date created
  isSelected?: boolean;
  onSelect?: (id: string, checked: boolean) => void;
  onDelete?: () => void; // Calls parent delete (via useUsers hook)
  onOpenComments?: () => void; // Optional: If user comments needed
}

export default function UserCard({
  id,
  email,
  role,
  status,
  created_at,
  isSelected = false,
  onSelect,
  onDelete,
  onOpenComments,
}: UserCardProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });
  const menuRef = useRef<HTMLDivElement | null>(null);

  // 🟢 Truncate ID (long UUID)
  const truncateId = (userId: string, maxLength = 8) => {
    if (!userId) return "No ID";
    return userId.length > maxLength ? `${userId.slice(0, maxLength)}...` : userId;
  };

  // 🟢 Handle click outside to close menu
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // 🟢 Close on Escape
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMenuOpen(false);
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, []);

  // NEW: User management menu items (admin-focused, using your APIs)
  const menuItems = [
    
    {
      name: "Approve User",
      icon: "/approve.png", // Your approve icon
      action: async () => {
        try {
          if (typeof window === "undefined") return; // FIXED: SSR-safe
          const token = localStorage.getItem("token");
          if (!token) return alert("Login required (admin only)");
          const res = await fetch(`/api/admin/users/${id}/status`, {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ status: "active" }), // FIXED: Use your API (sets status="active")
          });
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          const json = await res.json();
          if (!json.success) throw new Error(json.error || "Failed to approve");
          console.log("User approved:", id); // Debug
          window.location.reload(); // FIXED: Refresh grid (or use refetch from parent if passed)
        } catch (err: any) {
          console.error("Approve error:", err);
          alert(err.message || "Failed to approve user");
        }
        setMenuOpen(false);
      },
    },
    {
      name: "Ban User",
      icon: "/reject.png", // Your ban/reject icon
      action: async () => {
        try {
          if (typeof window === "undefined") return; // FIXED: SSR-safe
          const token = localStorage.getItem("token");
          if (!token) return alert("Login required (admin only)");
          const res = await fetch(`/api/admin/users/${id}/status`, {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ status: "banned" }), // FIXED: Use your API (sets status="banned")
          });
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          const json = await res.json();
          if (!json.success) throw new Error(json.error || "Failed to ban");
          console.log("User banned:", id); // Debug
          window.location.reload(); // FIXED: Refresh grid
        } catch (err: any) {
          console.error("Ban error:", err);
          alert(err.message || "Failed to ban user");
        }
        setMenuOpen(false);
      },
    },
    {
      name: "Delete",
      icon: "/deletelogo.png",
      action: () => {
        console.log("Delete clicked for user ID:", id); // FIXED: Debug
        setMenuOpen(false);
        onDelete?.(); // FIXED: Calls parent (UserGrid's handleDelete → useUsers deleteUser)
      },
    },
  ];

  const handleCheckboxChange = (checked: boolean) => {
    onSelect?.(id, checked);
  };

  // FIXED: Improved menu click handler (positioning, edge-safe)
  const handleMenuClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // FIXED: Prevent bubbling to card/checkbox
    console.log("Menu button clicked for user ID:", id, "Current open state:", menuOpen); // FIXED: Debug (remove in prod)
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const newTop = rect.bottom + 4; // 4px below button
    let newLeft = rect.left - 180 + 8; // Right-align to button (8px overlap)
    // FIXED: Prevent off-screen
    if (newLeft + 180 > window.innerWidth) {
      newLeft = window.innerWidth - 180 - 8; // Align to right edge
    }
    if (newLeft < 0) newLeft = 8; // Prevent negative
    setMenuPosition({ top: newTop, left: newLeft });
    setMenuOpen(!menuOpen); // Toggle
  };

  return (
    <div className="flex items-center justify-center w-full">
      <div
        className="relative flex flex-row items-center justify-between bg-white/[0.05]"
        style={{
          width: "100%",
          height: "76px",
          padding: "16px",
          gap: "16px",
          borderBottom: "1px dashed rgba(145,158,171,0.2)",
          boxSizing: "border-box",
          overflow: "visible", // FIXED: Ensure menu isn't clipped
        }}
      >
        {/* ✅ Checkbox (left) */}
        <div
          className="relative shrink-0 ml-2 cursor-pointer"
          onClick={(e) => {
            e.stopPropagation(); // FIXED: Prevent menu interference
            handleCheckboxChange(!isSelected);
          }}
        >
          <input
            type="checkbox"
            checked={isSelected}
            onChange={(e) => handleCheckboxChange(e.target.checked)}
            className="absolute opacity-0 w-5 h-5 cursor-pointer peer"
            id={`select-${id}`}
          />
          <div
            className={`w-5 h-5 rounded-none border border-[rgba(80,80,80,0.24)] bg-white/[0.05] peer-checked:bg-green-500 peer-checked:border-green-500 transition-all shadow-sm relative hover:border-green-400`} // FIXED: Hover feedback
          >
            {isSelected && (
              <svg
                className="absolute inset-0 w-5 h-5 text-white pointer-events-none scale-90"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={5}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M20 6L9 17l-5-5" />
              </svg>
            )}
          </div>
        </div>

        {/* ✅ Main Content (adapted for users) */}
        <div className="flex flex-row items-center flex-1 gap-12 min-w-0">
          {/* Avatar (placeholder) */}
          <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-400 shrink-0">
                          <Image
                            src="/person.jpg"
                            alt="Avatar"
                            width={40}
                            height={40}
                            className="w-full h-full object-cover"
                          />
                        </div>

          {/* Email / ID Block (title/desc – w-[370px]) */}
          <div className="flex w-[370px] flex-col items-start gap-2 shrink-0">
            <span className="text-white text-[12px] font-['Public Sans'] leading-[18px] block truncate">
              {email || "No email"} {/* NEW: Email as title/name */}
            </span>
            <span className="text-[10px] text-[rgba(204,204,204,0.5)] leading-[14px] font-['Public Sans'] block truncate">
              {id} {/* NEW: ID as description (truncated) */}
            </span>
          </div>

          {/* Date / Role / Status / Full Email Columns (gap-[100px] tight) */}
          <div className="flex flex-row gap-[100px] flex-1 min-w-0 items-center"> {/* FIXED: Tighter gap for user fields */}
            {/* Date Created */}
            <span className="text-white text-[12px] font-['Public Sans'] truncate min-w-[100px] text-center">
              {created_at
                ? new Date(created_at).toLocaleDateString("en-GB", {
                    day: "2-digit",
                    month: "2-digit",
                    year: "numeric",
                  })
                : "No date"} {/* NEW: created_at formatted */}
            </span>

            {/* Role (USER_ROLES badge) */}
            <span className="min-w-[100px] text-center">
              <span
                className={`px-2 py-1 rounded-full text-xs font-medium inline-block
                  ${
                    role === USER_ROLES.ADMIN
                      ? "bg-[rgba(0,112,244,0.16)] text-[#0070F4]" // Admin: Blue
                      : role === USER_ROLES.CREATOR
                      ? "bg-[rgba(34,197,94,0.16)] text-[#22C55E]" // Creator: Green
                      : role === USER_ROLES.CONSUMER
                      ? "bg-[rgba(255,171,0,0.16)] text-[#FFAB00]" // Consumer: Gray
                      : "bg-gray-600 text-gray-100" // Default
                  }`}
              >
                {role
                  .split("_")
                  .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
                  .join(" ")} {/* NEW: Role display (e.g., "Admin") */}
              </span>
            </span>

            {/* Status (USER_STATUS badge) */}
            <span className="min-w-[120px] text-center">
              <span
                className={`px-2 py-1 rounded-full text-xs font-medium inline-block
                  ${
                    status === USER_STATUS.ACTIVE
                      ? "bg-[rgba(34,197,94,0.16)] text-[#22C55E]" // Active: Green
                      : status === USER_STATUS.PENDING
                      ? "bg-[rgba(255,171,0,0.16)] text-[#FFAB00]" // Pending: Orange
                      : status === USER_STATUS.BANNED
                      ? "bg-[rgba(255,86,48,0.16)] text-[#FF5630]" // Banned: Red
                      : "bg-gray-600 text-gray-100" // Default
                  }`}
              >
                {status
                  .split("_")
                  .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
                  .join(" ")} {/* NEW: Status display (e.g., "Active") */}
              </span>
            </span>

            {/* Full Email (last column, truncated) */}
            <span className="text-white text-[12px] font-['Public Sans'] truncate min-w-[200px] text-center">
              {email || "No email"} {/* NEW: Full email (truncate via CSS) */}
            </span>
          </div>
        </div>

        {/* ✅ Menu Button (three vertical dots – right) */}
        <div className="relative" ref={menuRef}>
          <button
            onClick={handleMenuClick} // FIXED: Fires reliably
            className="flex justify-center items-center w-8 h-8 rounded-[6px] hover:bg-white/[0.1] transition-all text-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500/50" // FIXED: Hover/focus feedback
            aria-label="Open user menu"
          >
            {/* FIXED: Vertical dots SVG (stacked) */}
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="currentColor"
              viewBox="0 0 24 24"
              className="w-5 h-5"
            >
              <path d="M12 8a1 1 0 1 0 0-2 1 1 0 0 0 0 2zm0 4a1 1 0 1 0 0-2 1 1 0 0 0 0 2zm0 4a1 1 0 1 0 0-2 1 1 0 0 0 0 2z" />
            </svg>
          </button>
        </div>
      </div>

      {/* ✅ Portal Dropdown Menu (positioned, high z-index) */}
      {menuOpen &&
        createPortal(
          <div
            ref={menuRef} // FIXED: For outside click detection
            className="fixed z-[9999] w-[180px] rounded-[12px] border border-[rgba(80,80,80,0.24)] bg-white/[0.05] shadow-[inset_0_0_7px_rgba(255,255,255,0.16)] backdrop-blur-[12px] flex flex-col items-start p-[8px] gap-[4px]" // FIXED: Theme match, high z
            style={{
              top: `${menuPosition.top}px`,
              left: `${menuPosition.left}px`,
            }}
          >
            {menuItems.map((item) => (
              <button
                key={item.name}
                onClick={(e) => {
                  e.stopPropagation(); // FIXED: Prevent bubbling
                  console.log(`Menu item clicked: ${item.name} for user ID: ${id}`); // FIXED: Debug (remove in prod)
                  setMenuOpen(false); // FIXED: Close immediately
                  item.action(); // FIXED: Execute (API call or onDelete)
                }}
                className={`flex flex-row items-center px-[12px] py-[8px] gap-[8px] w-full rounded-[8px] text-white text-[13px] hover:bg-white/[0.08] transition-all focus:outline-none focus:ring-2 focus:ring-green-500/50 ${
                  item.name === "Delete" ? "text-red-400 hover:text-red-300" : "" // FIXED: Red hover for delete
                }`}
              >
                <Image
                  src={item.icon}
                  alt={item.name}
                  width={14}
                  height={14}
                  className="opacity-80" // FIXED: Subtle icon opacity
                />
                <span className="truncate">{item.name}</span>
              </button>
            ))}
          </div>,
          document.body // FIXED: Portal to body (avoids clipping)
        )}
    </div>
  );
}
