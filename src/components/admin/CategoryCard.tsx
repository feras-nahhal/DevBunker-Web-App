"use client";

import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import { TAG_CATEGORY_STATUS } from "@/lib/enums"; // For status badges (no roles for categories)

interface CategoryCardProps {
  id: string; // Request ID
  category_name: string; // FIXED: Category name (title)
  user_id: string; // User ID who created (for reference – not displayed)
  status: TAG_CATEGORY_STATUS; // Status (badge – lowercase enum: "pending" | "approved" | "rejected")
  created_at?: string; // Date created
  isSelected?: boolean;
  authorEmail?: string; // Email from user_id (for "Send" column)
  onSelect?: (id: string, checked: boolean) => void;
  onApprove?: () => void; // Optional: Approve action (via parent hook)
  onReject?: () => void; // Optional: Reject action (via parent hook)
}

export default function CategoryCard({
  id,
  category_name, // FIXED: category_name
  user_id, // Kept for reference (not displayed)
  status,
  created_at,
  isSelected = false,
  authorEmail,
  onSelect,
  onApprove,
  onReject,
}: CategoryCardProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });
  const menuRef = useRef<HTMLDivElement | null>(null);

  // Extract username from email (e.g., "john.doe" from "john.doe@example.com") or fallback
  const authorName = authorEmail ? authorEmail.split("@")[0] : "Unknown";

  // 🟢 Truncate ID (long UUID for user_id – unused now, but kept for reference)
  const truncateId = (userId: string, maxLength = 8) => {
    if (!userId) return "No User";
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

  // NEW: Category request menu items (admin-focused, call parent props – no direct API)
// Only show approve/reject if status is PENDING
const menuItems = [
  ...(status === TAG_CATEGORY_STATUS.PENDING
    ? [
        {
          name: "Approve Request",
          icon: "/approve.png", // Your approve icon
          action: () => {
            console.log("Approve clicked for category request ID:", id); // Debug (remove in prod)
            setMenuOpen(false);
            onApprove?.(); // Call parent hook (handles API + reload)
          },
        },
        {
          name: "Reject Request",
          icon: "/reject.png", // Your reject icon
          action: () => {
            console.log("Reject clicked for category request ID:", id); // Debug (remove in prod)
            setMenuOpen(false);
            onReject?.(); // Call parent hook (handles API + reload)
          },
        },
      ]
    : []),
    ...(status === TAG_CATEGORY_STATUS.APPROVED
    ? [
        {
          name: "Reject Request",
          icon: "/reject.png", // Your reject icon
          action: () => {
            console.log("Reject clicked for category request ID:", id); // Debug (remove in prod)
            setMenuOpen(false);
            onReject?.(); // Call parent hook (handles API + reload)
          },
        },
      ]
    : []),
      ...(status === TAG_CATEGORY_STATUS.REJECTED
    ? [
        {
          name: "Approve Request",
          icon: "/approve.png", // Your approve icon
          action: () => {
            console.log("Approve clicked for category request ID:", id); // Debug (remove in prod)
            setMenuOpen(false);
            onApprove?.(); // Call parent hook (handles API + reload)
          },
        }
      ]
    : []),
     // If not PENDING, show no menu items (or add others like "View" if needed)
];


  const handleCheckboxChange = (checked: boolean) => {
    onSelect?.(id, checked);
  };

  // FIXED: Improved menu click handler (positioning, edge-safe)
  const handleMenuClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // FIXED: Prevent bubbling to card/checkbox
    console.log("Menu button clicked for category request ID:", id, "Current open state:", menuOpen); // FIXED: "category request" (debug, remove in prod)
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
     <div className="w-full rounded-md cursor-pointer transition-colors duration-200 hover:bg-white/[0.08]">
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
        overflow: "visible",
      }}
    >
       {/* ✅ Rounded Checkbox with white border */}
        <div
          className="relative shrink-0 ml-2 cursor-pointer"
          onClick={(e) => {
            e.stopPropagation();
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
            className={`w-5 h-5 rounded-lg border border-[rgba(145,158,171,0.2)] bg-transparent transition-all shadow-sm relative hover:border-gray-300`} 
          >
            {isSelected && (
              <div className="absolute inset-1 bg-white rounded-sm" />
            )}
          </div>
        </div>

        {/* ✅ Main Content (adapted for category requests) */}
        <div className="flex flex-row items-center flex-1 gap-12 min-w-0">
          {/* Avatar (placeholder for category/request – commented out as per your code) */}
          {/* <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-400 shrink-0">
            <Image
              src="/category-icon.png" // FIXED: category icon if needed
              alt="Category Icon"
              width={40}
              height={40}
              className="w-full h-full object-cover"
            />
          </div> */}

          {/* Category Name / Category Id Block (title/desc – w-[300px]) */}
          <div className="flex w-[300px] flex-col items-start gap-2 shrink-0">
            <span className="text-white text-[14px] font-['Public Sans'] leading-[18px] block truncate">
              {category_name.length > 50 ? category_name.slice(0, 50) + "..." : category_name || "No category name"}
            </span>
          </div>

          {/* Date / Send / Status Columns (gap-[120px] tight, no role) */}
          <div className="flex flex-row gap-[120px] flex-1 min-w-0 items-center"> {/* FIXED: Gap as per your code */}
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

            {/* Send (authorName from email) */}
            <span className="text-white text-[12px] font-['Public Sans'] truncate min-w-[120px] text-center">
              {authorName} {/* FIXED: Email prefix or "Unknown" in "Send" column */}
            </span>

            {/* Status (TAG_CATEGORY_STATUS badge) */}
            <span className="min-w-[200px] text-center">
              <span
                className={`px-2 py-1 rounded-full text-xs font-medium inline-block
                  ${
                    status === TAG_CATEGORY_STATUS.APPROVED
                      ? "bg-[rgba(34,197,94,0.16)] text-[#22C55E]" // FIXED: Approved: Green (lighter bg + colored text)
                      : status === TAG_CATEGORY_STATUS.PENDING
                      ? "bg-[rgba(255,171,0,0.16)] text-[#FFAB00]" // FIXED: Pending: Orange
                      : status === TAG_CATEGORY_STATUS.REJECTED
                      ? "bg-[rgba(255,86,48,0.16)] text-[#FF5630]" // FIXED: Rejected: Red
                      : "bg-gray-600 text-gray-100" // Default
                  }`}
              >
                {status
                  .split("_")
                  .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
                  .join(" ")} {/* NEW: Status display (e.g., "Pending") */}
              </span>
            </span>
          </div>
        </div>

        {/* ✅ Menu Button (three vertical dots – right) */}
        <div className="relative" ref={menuRef}>
          <button
            onClick={handleMenuClick} // FIXED: Fires reliably
            className="flex justify-center items-center w-8 h-8 rounded-[6px] hover:bg-white/[0.1] transition-all text-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500/50" // FIXED: Hover/focus feedback
            aria-label="Open category menu" 
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
                  console.log(`Menu item clicked: ${item.name} for category request ID: ${id}`); // FIXED: "category request" (debug, remove in prod)
                  setMenuOpen(false); // FIXED: Close immediately
                  item.action(); // FIXED: Execute (calls parent prop)
                }}
                className={`flex flex-row items-center px-[12px] py-[8px] gap-[8px] w-full rounded-[8px] text-white text-[13px] hover:bg-white/[0.08] transition-all focus:outline-none focus:ring-2 focus:ring-green-500/50 ${
                  item.name.includes("Reject") ? "text-red-400 hover:text-red-300" : "" // FIXED: Red hover for reject (no delete)
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
    </div>
  );
}
