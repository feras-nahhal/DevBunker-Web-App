"use client";

import { useState, useRef, useEffect } from "react";
import { useBookmarksAndReadLater } from "@/hooks/useBookmarksAndReadLater";
import { useComments } from "@/hooks/useComments";
import Image from "next/image";
import { CONTENT_STATUS } from "@/lib/enums";
import { useRouter } from "next/navigation";
import { useVotes } from "@/hooks/useVotes";

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
  onOpenShare
}: ResearchCardProps) {
  const { votes, vote, loading: voteLoading } = useVotes(id);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  const handleShareClick = () => {
    if (onOpenShare) onOpenShare({ id, title, type });
  };
  
  const router = useRouter();
  const { comments: commentsData, loading: commentsLoading } = useComments(id);
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
                <Image
                  src="/person.jpg"
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

        {/* Bottom Section */}
        <div
          className="flex flex-col items-start bg-white/[0.05] rounded-[16px] backdrop-blur-md border border-white/10 shadow-[inset_0px_0px_4px_rgba(239,214,255,0.25)] mt-4"
          style={{ width: "297px", height: "265px", padding: "17px 20px" }}
        >
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
              <span className="relative z-10 text-[12px] font-poppins text-white opacity-80 capitalize">
                {type}
              </span>
            </div>

            {/* Status */}
            <div className="relative flex items-center justify-center w-[140px] h-[28px] rounded-full 
                bg-[rgba(239,214,255,0.05)] backdrop-blur-[10px] 
                shadow-[inset_0_0_4px_rgba(239,214,255,0.25)] isolate overflow-hidden">
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
              <span className="relative z-10 text-[12px] font-poppins text-white opacity-80 capitalize">
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
            <div className="flex flex-row items-center gap-2">
                                     {/* Likes */}
                                     <button
                                       onClick={() => vote("like")}
                                       className={votes.userVote === "like" ? "text-green-400" : "text-gray-400"}
                                     >
                                       <Image src="/uparrow.png" alt="Upvote" width={20} height={20} />
                                     </button>
                                     <span>{votes.likes}</span>
                       
                                     {/* Dislikes */}
                                     <button
                                       onClick={() => vote("dislike")}
                                       className={votes.userVote === "dislike" ? "text-red-400" : "text-gray-400"}
                                     >
                                       <Image src="/downarrow.png" alt="Downvote" width={20} height={20} />
                                     </button>
                                     <span>{votes.dislikes}</span>
                                   </div>

            <button
              onClick={(e) => {
                e.stopPropagation();
                onOpenComments && onOpenComments();
              }}
              className="flex items-center gap-2 cursor-pointer"
            >
              <Image
                src="/commentlogo.png"
                alt="Comment"
                width={20}
                height={20}
                className="hover:scale-105 transition"
              />
              <span className="text-sm text-gray-400">
                {commentsLoading ? "..." : commentsData.length}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
