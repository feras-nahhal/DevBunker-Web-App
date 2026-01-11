"use client";

import { useState, useRef, useEffect } from "react";
import { useBookmarksAndReadLater } from "@/hooks/useBookmarksAndReadLater";
import Image from "next/image";
import { CONTENT_STATUS } from "@/lib/enums";
import { useRouter } from "next/navigation";

interface ResearchCardProps {
  id: string;
  title: string;
  type: "post" | "mindmap" | "research";
  tags?: string[];
  votes?: number;
  status: CONTENT_STATUS;
  author_id: string;
  authorEmail?: string;
  onDelete?: () => void;
  onOpenComments?: () => void;
  onOpenContent?: () => void;
  onEdit?: () => void; // ✅ new edit handler
  onOpenShare?: (data: { id: string; title: string; type: "post" | "mindmap" | "research" }) => void;
  commentCount?: number;
  likes?: number; // Now used directly from props
  dislikes?: number; // Now used directly from props
  onVote?: (voteType: "like" | "dislike") => void; // New: Callback to grid for voting
  profileImage?: string | null; // User profile image URL
}

export default function ResearchCard({
  id,
  title,
  type,
  tags = [],
  votes: initialVotes = 0,
  status,
  author_id,
  authorEmail,
  onDelete,
  onOpenComments,
  onOpenContent,
  onEdit,
  onOpenShare,
  commentCount = 0,
  likes = 0, // Use directly from props
  dislikes = 0, // Use directly from props
  onVote, // Use this to handle votes
  profileImage
}: ResearchCardProps) {

  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  const handleShareClick = () => {
    if (onOpenShare) onOpenShare({ id, title, type });
  };
  
  const router = useRouter();

  const authorName = authorEmail ? authorEmail.split("@")[0] : "Unknown";
  const { addBookmark, addReadLater } = useBookmarksAndReadLater();

  const typeImages: Record<"post" | "mindmap" | "research", string> = {
    post: "/postcard.png",
    mindmap: "/mindcard.png",
    research: "/recerchcard.png",
  };

  const displayImage = typeImages[type];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // 🧭 Menu Items (no author check needed — grid already filtered)
  const menuItems: { name: string; icon: string; action: () => void }[] = [
    ...(type === "post"
      ? [
          {
            name: "Start Research",
            icon: "/reserchlogo.png",
            action: () => console.log("Starting research…"),
          },
        ]
      : []),
    {
      name: "Share",
      icon: "/sharelogo.png",
      action: handleShareClick,
    },
    {
      name: "Add Bookmark",
      icon: "/bookmarklogo.png",
      action: async () => {
        try {
          await addBookmark(id);
          setMenuOpen(false);
        } catch (err: unknown) {
          alert(err instanceof Error ? err.message : "Failed to add bookmark.");
        }
      },
    },
    {
      name: "Read it Later",
      icon: "/readlaterlogo.png",
      action: async () => {
        try {
          await addReadLater(id);
          setMenuOpen(false);
        } catch (err: unknown) {
          alert(err instanceof Error ? err.message : "Failed to add to read-later.");
        }
      },
    },
    {
      name: "Edit",
      icon: "/draft.svg",
      action: () => {
        if (type === "post") {
          router.push(`/dashboard/posts/create?id=${id}`);
        } else if (type === "research") {
          router.push(`/dashboard/research/create?id=${id}`);
        } else if (type === "mindmap") {
          router.push(`/dashboard/mindmaps/create?id=${id}`);
        }
      },
    },
    {
      name: "Delete",
      icon: "/deletelogo.png",
      action: () => onDelete && onDelete(),
    },
  ];

  return (
    <div className="flex items-center justify-center px-6">
      <div
        className="relative flex flex-col items-center 
        bg-white/[0.05] border border-[rgba(80,80,80,0.24)] 
        shadow-[inset_0px_0px_7px_rgba(255,255,255,0.16)] 
        rounded-[16px] overflow-hidden"
        style={{ width: "325px", height: "567.64px", padding: "8px", gap: "4px" }}
      >
        {/* Header */}
        <div className="flex flex-row justify-between items-start w-[309px] h-[66px] px-4 pt-4 gap-[45px]">
          <div className="flex flex-row items-center min-w-0">
            <div className="flex items-center justify-center">
              <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-400 shrink-0">
                <img
                  src={ profileImage|| "/person.jpg"}
                  alt="Avatar"
                  width={40}
                  height={40}
                  className="w-full h-full object-cover"
                />
              </div>
            </div>

            <div className="flex flex-col justify-center items-start pl-[16px]">
              <span className="text-white text-[14px] font-['Public Sans'] leading-[22px]">
                {authorName}
              </span>
              <span className="text-[12px] text-[rgba(204,204,204,0.5)] leading-[18px] font-['Public Sans']">
                #{author_id.split("-")[0]}
              </span>
            </div>
          </div>

          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="flex justify-center items-center w-[20px] h-[20px] rounded-[6px] hover:bg-white/[0.1] transition"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="w-[20px] h-[20px] text-[#CCCCCC]"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6.75 12a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm6 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm6 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0z"
                />
              </svg>
            </button>

            {menuOpen && (
              <div className="absolute right-0 mt-2 w-[194px] rounded-[12px] border border-[rgba(80,80,80,0.24)] bg-white/[0.05] shadow-[inset_0_0_7px_rgba(255,255,255,0.16)] backdrop-blur-[12px] flex flex-col items-center p-[4px] gap-[4px] z-50">
                {menuItems.map((item) => (
                  <button
                    key={item.name}
                    onClick={() => {
                      setMenuOpen(false);
                      item.action();
                    }}
                    className={`flex flex-row items-center px-[8px] py-[6px] gap-[8px] w-full rounded-[8px] text-white text-[14px] hover:bg-white/[0.08] transition ${
                      item.name === "Delete" ? "text-red-400" : ""
                    } ${item.name === "Edit" ? "text-green-400" : ""}`}
                  >
                    <Image src={item.icon} alt={item.name} width={16} height={16} />
                    {item.name}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Image (opens popup) */}
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

        {/* Bottom section with glass & hover glow */}
          <div
            className="
              relative flex flex-col items-start
              bg-white/[0.05] rounded-[16px]
              backdrop-blur-md border border-white/10
              shadow-[inset_0px_0px_4px_rgba(239,214,255,0.25)]
              mt-4 overflow-hidden group
              transition-all duration-300
              hover:shadow-[inset_0px_0px_4px_rgba(239,214,255,0.35)]
            "
            style={{ width: "297px", height: "265px", padding: "17px 20px" }}
            
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
          {/* Type + Status Row */}
          <div className="flex items-center justify-between w-full px-1 mb-3">
            {/* Type */}
            <div className="relative flex items-center justify-center w-[90px] h-[28px] rounded-full 
                bg-[rgba(239,214,255,0.05)] backdrop-blur-[10px] 
                shadow-[inset_0_0_4px_rgba(239,214,255,0.25)] isolate overflow-hidden">
              <div
                className={`absolute inset-0 rounded-full z-0 ${
                  {
                    post: "bg-[linear-gradient(89.65deg,rgba(255,140,0,0.15)_0%,#FFA500_50%,rgba(255,140,0,0.15)_100%)]",
                    mindmap: "bg-[linear-gradient(89.65deg,rgba(30,144,255,0.15)_0%,#1E90FF_50%,rgba(30,144,255,0.15)_100%)]",
                    research: "bg-[linear-gradient(89.65deg,rgba(34,197,94,0.15)_0%,#22C55E_50%,rgba(34,197,94,0.15)_100%)]",
                  }[type]
                }`}
              />
              <span className="relative z-10 text-[14px] font-bold font-poppins text-white capitalize">
                {type}
              </span>
            </div>

            {/* Status */}
            <div
              className={`relative flex items-center justify-center h-[28px] rounded-full 
                          bg-[rgba(239,214,255,0.05)] backdrop-blur-[10px] 
                          shadow-[inset_0_0_4px_rgba(239,214,255,0.25)] isolate overflow-hidden
                          ${status === "pending_approval" ? "w-[140px]" : "w-[90px]"}`}
            >
              <div
                className={`absolute inset-0 rounded-full z-0 ${
                  {
                    draft: "bg-[linear-gradient(89.65deg,rgba(128,128,128,0.18)_0%,#8E8E8E_50%,rgba(128,128,128,0.18)_100%)]",
                    published: "bg-[linear-gradient(89.65deg,rgba(34,197,94,0.18)_0%,#22C55E_50%,rgba(34,197,94,0.18)_100%)]",
                    pending_approval: "bg-[linear-gradient(89.65deg,rgba(255,165,0,0.18)_0%,#FFA500_50%,rgba(255,165,0,0.18)_100%)]",
                    approved: "bg-[linear-gradient(89.65deg,rgba(30,144,255,0.18)_0%,#1E90FF_50%,rgba(30,144,255,0.18)_100%)]",
                    rejected: "bg-[linear-gradient(89.65deg,rgba(255,69,58,0.18)_0%,#FF3B30_50%,rgba(255,69,58,0.18)_100%)]",
                  }[status]
                }`}
              />
              <span className="relative z-10 text-[14px] font-bold font-poppins text-white capitalize">
                {status.replace("_", " ")}
              </span>
            </div>
          </div>

          {/* Title & Tags */}
          <div>
            <h5 className="text-lg font-bold text-white leading-6 w-full line-clamp-2 overflow-hidden">
              {title}
            </h5>

            <div className="flex flex-wrap gap-2 w-full mt-2">
              {tags.length > 0 ? (
                <>
                  {tags.slice(0, 4).map((tag) => (
                    <span
                      key={tag}
                      className="px-2 py-1 border border-gray-700/30 rounded-full text-[12px] text-gray-400"
                    >
                      {tag}
                    </span>
                  ))}
                  {tags.length > 4 && (
                    <span className="px-2 py-1 border border-gray-700/30 rounded-full text-[12px] text-gray-400">
                      +{tags.length - 4}
                    </span>
                  )}
                </>
              ) : (
                <span className="text-gray-500 text-sm">No tags</span>
              )}
            </div>
          </div>

          {/* Spacer */}
          <div className="flex-1" />

          {/* Votes & Comments */}
          <div className="flex flex-row items-center justify-between w-full h-[44px] mt-2">
          {/* Likes/Dislikes */}
            <div className="flex items-center gap-2">
            <button
              onClick={() => onVote && onVote("like")}
              className="flex items-center gap-1 text-gray-400"
            >
              <Image src="/arrawUp.svg" alt="Upvote" width={20} height={20} />
              <span>{likes}</span>
            </button>

            <button
              onClick={() => onVote && onVote("dislike")}
              className="flex items-center gap-1 text-gray-400"
            >
              <Image src="/arrawDown.svg" alt="Downvote" width={20} height={20} />
              <span>{dislikes}</span>
            </button>
          </div>

           <button
                         onClick={(e) => {
                           e.stopPropagation();
                           onOpenComments && onOpenComments();
                         }}
                         className="relative flex items-center gap-[4px] cursor-pointer group"
                       >
                         {/* 🌟 Icon container — only shows glass + glow on hover */}
                         <div
                           className="
                             relative flex items-center justify-center
                             w-[32px] h-[32px] rounded-md
                             transition-all duration-300
                             overflow-hidden
                             group-hover:bg-white/[0.03]
                             group-hover:border group-hover:border-white/10
                             group-hover:shadow-[inset_0_0_4px_rgba(239,214,255,0.25)]
                             group-hover:backdrop-blur-md
                           "
                         >
                           {/* 💡 Bottom glow */}
                           <span
                             className="
                               absolute inset-x-0 bottom-0 h-1/2
                               bg-[radial-gradient(circle_at_bottom,rgba(91,228,155,0.6)_0%,transparent_80%)]
                               opacity-0 group-hover:opacity-100
                               transition-opacity duration-500
                               blur-[6px]
                             "
                           />
           
                           {/* 🟢 Comment icon — swaps on hover */}
                           <Image
                             src="/coment1.svg"
                             alt="Comment"
                             width={18}
                             height={18}
                             className="relative z-10 transition-opacity duration-300 group-hover:opacity-0"
                           />
                           <Image
                             src="/coment.svg"
                             alt="Comment Hover"
                             width={18}
                             height={18}
                             className="absolute z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                           />
                         </div>
           
                         {/* 🔢 Comment count */}
                         <span className="text-sm text-gray-400 relative top-[1px]">
                           {commentCount}
                         </span>
                       </button>
          </div>
        </div>
      </div>
    </div>
  );
}
