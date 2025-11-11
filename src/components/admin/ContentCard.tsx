"use client";

import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { useBookmarksAndReadLater } from "@/hooks/useBookmarksAndReadLater";
import { CONTENT_STATUS } from "@/lib/enums"; // Add this import if not present
import Image from "next/image";

interface ContentCardProps {
  id: string;
  title: string;
  type: "post" | "mindmap" | "research";
  tags?: string[];
  author_id: string;
  status: string;
  authorEmail?: string;
  description?: string;
  created_at?: string;
  isSelected?: boolean;
  onSelect?: (id: string, checked: boolean) => void;
  onDelete?: () => void;
  onOpenComments?: () => void;
  onOpenShare?: (data: { id: string; title: string; type: "post" | "mindmap" | "research" }) => void;
  commentCount?: number;
}

export default function ContentCard({
  id,
  title,
  type,
  tags = [],
  author_id,
  authorEmail,
  description,
  status,
  created_at,
  isSelected = false,
  onSelect,
  onDelete,
  onOpenComments,
  commentCount = 0,
  onOpenShare,
}: ContentCardProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });
  const menuRef = useRef<HTMLDivElement | null>(null);
  const { addBookmark, addReadLater } = useBookmarksAndReadLater();
 

  const authorName = authorEmail ? authorEmail.split("@")[0] : "Unknown";

  // 🟢 Truncate description text
  const truncateDescription = (desc: string, maxWords = 10) => {
    if (!desc?.trim()) return "No description";
    const words = desc.trim().split(/\s+/);
    return words.length <= maxWords
      ? desc.trim()
      : words.slice(0, maxWords).join(" ") + " .....";
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

  const handleShareClick = () => {
    if (onOpenShare) onOpenShare({ id, title, type });
  };

 

// ... (rest of your component code)

const menuItems = [
  {
    name: `View Research ${commentCount}`, // Always show
    icon: "/reserchlogo.png",
    action: () => {
      console.log('Comments clicked for ID:', id);
      setMenuOpen(false);
      onOpenComments?.();
    },
  },
  { name: "Share",
      icon: "/sharelogo.png",
      action: handleShareClick, }, // Always show
  // Conditionally show approve/reject based on status
  ...(status === CONTENT_STATUS.PENDING_APPROVAL
    ? [
        {
          name: "Approve Content",
          icon: "/approve.png",
          action: async () => {
            try {
              const token = localStorage.getItem("token");
              if (!token) return;
              await fetch(`/api/admin/content/${id}/approve`, {
                method: "PUT",
                headers: {
                  "Content-Type": "application/json",
                  Authorization: `Bearer ${token}`,
                },
              });
              window.location.reload();
            } catch {
              // No console or alert
            }
            setMenuOpen(false);
          },
        },
        {
          name: "Reject Content",
          icon: "/reject.png",
          action: async () => {
            try {
              const token = localStorage.getItem("token");
              if (!token) return;
              await fetch(`/api/admin/content/${id}/reject`, {
                method: "PUT",
                headers: {
                  "Content-Type": "application/json",
                  Authorization: `Bearer ${token}`,
                },
              });
              window.location.reload();
            } catch {
              // No console or alert
            }
            setMenuOpen(false);
          },
        },
      ]
    : status === CONTENT_STATUS.PUBLISHED
    ? [
        {
          name: "Reject Content",
          icon: "/reject.png",
          action: async () => {
            try {
              const token = localStorage.getItem("token");
              if (!token) return;
              await fetch(`/api/admin/content/${id}/reject`, {
                method: "PUT",
                headers: {
                  "Content-Type": "application/json",
                  Authorization: `Bearer ${token}`,
                },
              });
              window.location.reload();
            } catch {
              // No console or alert
            }
            setMenuOpen(false);
          },
        },
      ]
    : status === CONTENT_STATUS.REJECTED
    ? [
        {
          name: "Approve Content",
          icon: "/approve.png",
          action: async () => {
            try {
              const token = localStorage.getItem("token");
              if (!token) return;
              await fetch(`/api/admin/content/${id}/approve`, {
                method: "PUT",
                headers: {
                  "Content-Type": "application/json",
                  Authorization: `Bearer ${token}`,
                },
              });
              window.location.reload();
            } catch {
              // No console or alert
            }
            setMenuOpen(false);
          },
        },
      ]
    : []), // Fallback: no approve/reject if status is invalid
  {
    name: "Delete",
    icon: "/deletelogo.png",
    action: () => {
      console.log('Delete clicked for ID:', id);
      setMenuOpen(false);
      onDelete?.();
    },
  },
];


  const handleCheckboxChange = (checked: boolean) => {
    onSelect?.(id, checked);
  };

  // FIXED: Improved menu click handler (with debug + better positioning)
  const handleMenuClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // FIXED: Prevent bubbling to card/checkbox
    console.log('Menu button clicked for ID:', id, 'Current open state:', menuOpen); // FIXED: Debug log (remove in prod)
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    // FIXED: Correct positioning (account for scroll + viewport edges)
    const newTop = rect.bottom + 4; // 4px below button
    let newLeft = rect.left - 180 + 8; // Right-align menu to button (8px overlap for arrow feel)
    // FIXED: Prevent off-screen (adjust if near right edge)
    if (newLeft + 180 > window.innerWidth) {
      newLeft = window.innerWidth - 180 - 8; // Align to right edge
    }
    if (newLeft < 0) newLeft = 8; // Prevent negative left
    setMenuPosition({ top: newTop, left: newLeft });
    setMenuOpen(!menuOpen); // Toggle open/close
  };

  // FIXED: Close menu on escape key or outside click (enhanced useEffect)
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setMenuOpen(false);
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, []);

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

        {/* ✅ Main Content */}
        <div className="flex flex-row items-center flex-1 gap-12 min-w-0">
          <Image src="/iconadmin (1).png" alt="Avatar" width={40} height={40} />

          {/* Title + Desc */}
          <div className="flex w-[370px] flex-col items-start gap-2 shrink-0">
            <span className="text-white text-[14px] font-['Public Sans'] leading-[18px] block">
              {title.length > 50 ? title.slice(0, 50) + "..." : title}
            </span>
          </div>


          {/* Date + Author + Status */}
          <div className="flex flex-row  flex-1 min-w-0 items-center">
            <span className="text-white text-[12px] font-['Public Sans'] truncate"style={{ marginRight: '150px' }}>
              {created_at
                ? new Date(created_at).toLocaleDateString("en-GB", {
                    day: "2-digit",
                    month: "2-digit",
                    year: "numeric",
                  })
                : "No date"}
            </span>
            <div className="w-60"> <span className="text-white text-[12px] font-['Public Sans'] truncate" style={{ marginRight: '140px' }}>
              {authorName}
            </span></div>
            
            <span
              className={`px-2 py-1 rounded-full text-xs font-medium
                ${
                  status === "draft"
                    ? "bg-[rgba(145,158,171,0.16)] text-[#919EAB]" 
                    : status === "published"
                    ? "bg-[rgba(34,197,94,0.16)] text-[#22C55E]"  
                    : status === "pending_approval"
                    ? "bg-[rgba(255,171,0,0.16)] text-[#FFAB00]"
                    : status === "approved"
                    ? "bg-[rgba(0,112,244,0.16)] text-[#0070F4]"
                    : status === "rejected"
                    ? "bg-[rgba(255,86,48,0.16)] text-[#FF5630]"
                    : "bg-gray-600 text-gray-100"
                }`}
            >
              {status
                .split("_")
                .map((word) => word[0].toUpperCase() + word.slice(1).toLowerCase())
                .join(" ")}
            </span>
          </div>
        </div>

        {/* ✅ Menu Button (three vertical dots) */}
        <div className="relative" ref={menuRef}>
          <button
            onClick={handleMenuClick} // FIXED: Now fires reliably
            className="flex justify-center items-center w-8 h-8 rounded-[6px] hover:bg-white/[0.1] transition-all text-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500/50" // FIXED: Added focus ring for accessibility/hover feedback
            aria-label="Open menu"
          >
            {/* FIXED: Vertical dots SVG (stacked circles – proper vertical ellipsis) */}
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="currentColor"
              viewBox="0 0 24 24"
              className="w-5 h-5" // FIXED: Slightly larger for visibility
            >
              <path d="M12 8a1 1 0 1 0 0-2 1 1 0 0 0 0 2zm0 4a1 1 0 1 0 0-2 1 1 0 0 0 0 2zm0 4a1 1 0 1 0 0-2 1 1 0 0 0 0 2z" /> {/* FIXED: Vertical stacked dots path */}
            </svg>
          </button>
        </div>
      </div>

      {/* ✅ Portal Dropdown (always visible, positioned correctly, high z-index) */}
      {menuOpen &&
        createPortal(
          <div
            ref={menuRef} // FIXED: Attach ref to portal for outside click detection
            className="fixed z-[9999] w-[180px] rounded-[12px] border border-[rgba(80,80,80,0.24)] bg-white/[0.05] shadow-[inset_0_0_7px_rgba(255,255,255,0.16)] backdrop-blur-[12px] flex flex-col items-start p-[8px] gap-[4px]" // FIXED: High z-index to stay on top
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
                  console.log(`Menu item clicked: ${item.name} for ID: ${id}`); // FIXED: Debug log (remove in prod)
                  setMenuOpen(false); // FIXED: Close menu immediately
                  item.action(); // FIXED: Execute action
                }}
                className={`flex flex-row items-center px-[12px] py-[8px] gap-[8px] w-full rounded-[8px] text-white text-[13px] hover:bg-white/[0.08] transition-all focus:outline-none focus:ring-2 focus:ring-green-500/50 ${
                  item.name === "Delete" ? "text-red-400 hover:text-red-300" : "" // FIXED: Hover for delete
                }`}
              >
                <Image
                  src={item.icon}
                  alt={item.name}
                  width={14}
                  height={14}
                  className="opacity-80" // FIXED: Subtle opacity for icons
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
