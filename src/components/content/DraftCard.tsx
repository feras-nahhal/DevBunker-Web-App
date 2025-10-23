"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useContent } from "@/hooks/useContent";
import { CONTENT_STATUS } from "@/lib/enums";
import { useAuthContext } from "@/hooks/AuthProvider";
interface DraftCardProps {
  id: string;
  title: string;
  type: "post" | "mindmap" | "research";
  categoryName?: string[];
  votes?: number;
  created_at?: string;
  comments?: number;
  author_id: string;
  authorEmail?: string;
  onOpenContent?: () => void;
}

export default function DraftCard({
  id,
  title,
  type,
  categoryName,
  created_at,
  votes: initialVotes = 0,
  comments: initialComments = 0,
  author_id,
  authorEmail,
  onOpenContent
}: DraftCardProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const router = useRouter();

  const { user,token} = useAuthContext(); // ✅ get logged-in user and token
  const { deleteContent, updateContent } = useContent({ type });
  const [loading, setLoading] = useState(false);

  const authorName = authorEmail ? authorEmail.split("@")[0] : "Unknown";

  // Image per type
  const typeImages: Record<"post" | "mindmap" | "research", string> = {
    post: "/postcard.png",
    mindmap: "/mindcard.png",
    research: "/recerchcard.png",
  };
  const displayImage = typeImages[type];

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  /** 🗑️ Handle Delete */
  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this draft?")) return;
    try {
      setLoading(true);
      await deleteContent(id, token || undefined);
      alert("Deleted successfully!");
    } catch (err) {
      console.error("Delete failed:", err);
      alert("Failed to delete content.");
    } finally {
      setLoading(false);
    }
  };

  /** ✏️ Handle Edit */
  const handleEdit = () => {
    const editRoutes: Record<typeof type, string> = {
      post: `/dashboard/posts/create?id=${id}`,
      mindmap: `/dashboard/mindmaps/create?id=${id}`,
      research: `/dashboard/research/create?id=${id}`,
    };
    router.push(editRoutes[type]);
  };

  /** ✅ Handle Approve (status update) */
  const handleApprove = async () => {
  try {
    setLoading(true);
    if (type === "research") {
      // Send for approval (not directly published)
      await updateContent(id, { status: CONTENT_STATUS.PENDING_APPROVAL }, token || undefined);
      alert("Approval request sent successfully!");
    } else {
      // Directly publish posts or mindmaps
      await updateContent(id, { status: CONTENT_STATUS.PUBLISHED }, token || undefined);
      alert("Draft approved successfully!");
    }
  } catch (err) {
    console.error("Approval failed:", err);
    alert("Failed to process approval.");
  } finally {
    setLoading(false);
  }
  };

  /** Menu Items */
  const menuItems = [
    { name: "Edit", icon: "/draft.svg", action: handleEdit },
    {
      name: type === "research" ? "Publish" : "Publish",
      icon: "/approve.png",
      action: handleApprove,
    },
    { name: "Delete", icon: "/deletelogo.png", action: handleDelete },
  ];

  return (
    <div className="flex items-center justify-center px-6">
      <div
        className="relative flex flex-col items-center bg-white/[0.05] border border-[rgba(80,80,80,0.24)]
        shadow-[inset_0px_0px_7px_rgba(255,255,255,0.16)] rounded-[16px] overflow-hidden"
        style={{ width: "330px", height: "402.64px", padding: "8px", gap: "4px" }}
      >
        {/* ───── Header with menu ───── */}
        <div className="flex justify-between items-start w-full px-3 pt-2">
          <div className="flex flex-col text-white text-sm">
            
            <span className="text-xs text-gray-400">#{author_id.slice(0, 6)}</span>
          </div>

          {/* Menu Button */}
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="flex justify-center items-center w-[24px] h-[24px] rounded-md hover:bg-white/[0.1] transition"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"
                strokeWidth={1.5} stroke="currentColor" className="w-[20px] h-[20px] text-gray-300">
                <path strokeLinecap="round" strokeLinejoin="round"
                  d="M6.75 12a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm6 0a.75.75 0
                  11-1.5 0 .75.75 0 011.5 0zm6 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0z" />
              </svg>
            </button>

            {/* Dropdown */}
            {menuOpen && (
              <div className="absolute right-0 mt-2 w-[180px] rounded-[12px] border border-white/20 bg-white/[0.05]
              backdrop-blur-md shadow-[inset_0_0_7px_rgba(255,255,255,0.16)] p-2 flex flex-col gap-1 z-50">
                {menuItems.map((item) => (
                  <button
                    key={item.name}
                    disabled={loading}
                    onClick={() => { setMenuOpen(false); item.action(); }}
                    className={`flex items-center gap-2 text-sm text-white px-3 py-2 rounded-lg hover:bg-white/[0.08] transition ${
                      item.name === "Delete" ? "text-red-400" : ""
                    }`}
                  >
                    <Image src={item.icon} alt={item.name} width={16} height={16} />
                    {item.name}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ───── Image ───── */}
        <div
          className="mt-2 block rounded-[14px] overflow-hidden cursor-pointer"
          style={{ width: "290px", height: "216px" }}
          onClick={(e) => {
            e.stopPropagation();
            onOpenContent && onOpenContent();
          }}
        >
          <Image
            src={displayImage}
            alt={title}
            width={300}
            height={216}
            className="object-cover w-full h-full"
          />
        </div>

        {/* Inner Bottom Box */}
        <div
          className="flex flex-col items-start bg-white/[0.05] rounded-[16px] backdrop-blur-md border border-white/10 shadow-[inset_0px_0px_4px_rgba(239,214,255,0.25)] mt-4 overflow-hidden group
              transition-all duration-300
              hover:shadow-[inset_0px_0px_4px_rgba(239,214,255,0.35)]"
          style={{
            width: "300px",
            height: "166px",
            padding: "17px 10px",
            gap: "19px",
          }}
          onClick={(e) => {
            e.stopPropagation();
            onOpenContent && onOpenContent();
          }}
        >
          {/* 🌟 Bottom Glow (only on hover) */}
            <span
              className="
                absolute inset-x-0 bottom-0 h-1/2
                bg-[linear-gradient(to_top,rgba(91,228,155,0.25)_0%,rgba(91,228,155,0.15)_30%,transparent_100%)]

                opacity-0 group-hover:opacity-100
                transition-opacity duration-700
                blur-[12px]
                pointer-events-none
              "
            />
          {/* Type with Strong Glow */}
          <div className="flex items-center justify-center w-[58px] h-[28px] relative">
            <div className="w-full h-full rounded-full bg-white/[0.05] border border-white/10 shadow-[inset_0_0_4px_rgba(239,214,255,0.25)] backdrop-blur-[10px] text-white font-bold text-[13px] flex items-center justify-center relative overflow-hidden">
              {/* Radial Glow Overlay */}
              <span className="absolute inset-0 rounded-full bg-[radial-gradient(circle,rgba(255,255,255,0.85)_0%,transparent_70%)] blur-md" />
              {/* Text */}
              <span className="relative z-10">Draft</span>
            </div>
          </div>

         {/* Title */}
        <div className="flex flex-col w-[269px]">
          <h5 className="text-lg font-bold text-white leading-6 truncate">{title}</h5>
          {title.split(" ").length > 8}
        </div>

        {/* Frame 3 (Category + Date Row) */}
        <div className="flex flex-row items-left gap-1 w-[300px] h-[28px]">
           {/* Date */}
          <span
            className={`px-2 py-1 border border-gray-700/30 rounded-full text-[12px] ${
              created_at ? "text-gray-400" : "text-gray-500 italic"
            }`}
          >
            Date: {created_at ? new Date(created_at).toISOString().split("T")[0] : "No date"}
          </span>
          {/* Category */}
          <span
            className={`px-2 py-1 border border-gray-700/30 rounded-full text-[12px] ${
              categoryName ? "text-gray-400" : "text-gray-500 italic"
            }`}
          >
            Category: {categoryName || "No category"}
          </span>
        </div>


        </div>
      </div>
    </div>
  );
}