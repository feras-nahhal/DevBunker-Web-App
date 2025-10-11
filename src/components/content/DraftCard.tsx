"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";

interface ContentCardProps {
  id: string;
  title: string;
  type: "post" | "mindmap" | "research";
  categoryName?: string[];
  votes?: number;
  created_at?: string; // 👈 new optional date prop
  comments?: number;
  author_id: string;     // 👈 show instead of id in header
  authorEmail?: string;  // 👈 new prop
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
}: ContentCardProps) {
  const [votes, setVotes] = useState(initialVotes);
  const [comments] = useState(initialComments);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  // type → image map
  const typeImages: Record<"post" | "mindmap" | "research", string> = {
    post: "/postcard.png",
    mindmap: "/mindcard.png",
    research: "/recerchcard.png",
  };

  const displayImage = typeImages[type];

  // derive authorName from email (before "@")
  const authorName = authorEmail ? authorEmail.split("@")[0] : "Unknown";

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const menuItems = [
    { name: "Start Research", icon: "/reserchlogo.png", href: "#" },
    { name: "Share", icon: "/sharelogo.png", href: "#" },
    { name: "Bookmark", icon: "/bookmarklogo.png", href: "#" },
    { name: "Read it Later", icon: "/readlaterlogo.png", href: "#" },
    { name: "Delete", icon: "/deletelogo.png", href: "#" },
  ];

  return (
    <div className="flex items-center justify-center px-6">
      {/* Outer Card */}
      <div
        className="relative flex flex-col items-center 
        bg-white/[0.05] border border-[rgba(80,80,80,0.24)] 
        shadow-[inset_0px_0px_7px_rgba(255,255,255,0.16)] 
        rounded-[16px] overflow-hidden"
        style={{ width: "325px", height: "402.64px", padding: "8px", gap: "4px" }}
      >
    

        {/* Image */}
        <Link
          href={`/content/${id}`}
          className="mt-2 block rounded-[14px] overflow-hidden"
          style={{ width: "300px", height: "216.64px" }}
        >
          <Image
            src={displayImage}
            alt={title}
            width={300}
            height={216}
            className="object-cover w-full h-full hover:scale-[1.02] transition-transform duration-300"
          />
        </Link>

        {/* Inner Bottom Box */}
        <div
          className="flex flex-col items-start bg-white/[0.05] rounded-[16px] backdrop-blur-md border border-white/10 shadow-[inset_0px_0px_4px_rgba(239,214,255,0.25)] mt-4"
          style={{
            width: "300px",
            height: "166px",
            padding: "17px 20px",
            gap: "19px",
          }}
        >
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
          <h5 className="text-lg font-bold text-white leading-6 w-[269px]">{title}</h5>

        {/* Frame 3 (Category + Date Row) */}
        <div className="flex flex-row items-center gap-2 w-[269px] h-[28px]">
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
