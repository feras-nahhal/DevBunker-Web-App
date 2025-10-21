"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import { useComments } from "@/hooks/useComments"; // NEW: For dynamic comment count
import { useAuth } from "@/hooks/useAuth"; // ✅ import your auth hook
import { useRouter } from "next/navigation";
interface ReadlaterCardProps {
  id: string;
  title: string;
  type: "post" | "mindmap" | "research";
  tags?: string[];
  votes?: number;
  // REMOVED: comments prop (use hook for dynamic count)
  author_id: string;
  authorEmail?: string;
  onDelete?: () => void;
  onRemoveFromReadlater?: () => void; // ✅ new prop
  onOpenComments?: () => void; // NEW: For opening comments popup\
  onOpenContent?: () => void;
  onOpenShare?: (data: { id: string; title: string; type: "post" | "mindmap" | "research" }) => void;
}

export default function ReadlaterCard({
  id,
  title,
  type,
  tags = [],
  votes: initialVotes = 0,
  // REMOVED: comments: initialComments = 0 (unused)
  author_id,
  authorEmail,
  onDelete,
  onRemoveFromReadlater,
  onOpenComments,
  onOpenContent,
  onOpenShare
}: ReadlaterCardProps) {
  const [votes, setVotes] = useState(initialVotes);
  // REMOVED: const [comments] = useState(initialComments); (unused)
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const router = useRouter();
  // NEW: Hook for dynamic comment count
  const { comments: commentsData, loading: commentsLoading } = useComments(id);
  const { user } = useAuth(); // ✅ get logged-in user
  const authorIdShort = author_id.split("-")[0]; // "b655deff"

  const handleShareClick = () => {
    if (onOpenShare) onOpenShare({ id, title, type });
  };


  const typeImages: Record<"post" | "mindmap" | "research", string> = {
    post: "/postcard.png",
    mindmap: "/mindcard.png",
    research: "/recerchcard.png",
  };

  const displayImage = typeImages[type];
  const authorName = authorEmail ? authorEmail.split("@")[0] : "Unknown";

  // close menu on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const menuItems: { name: string; icon: string; action: () => void }[] = [
  ...(type === "post"
    ? [
        { name: "Start Research", icon: "/reserchlogo.png", action: () => {router.push(`/dashboard/research/create?title=${encodeURIComponent(title)}`);} },
      ]
    : []),
  {
      name: "Share",
      icon: "/sharelogo.png",
      action: handleShareClick,
    },
  {
    name: "Remove Readlater",
    icon: "/readlaterlogo.png",
    action: async () => {
      if (onRemoveFromReadlater) await onRemoveFromReadlater();
    },
  },
];

// Add Delete button only if user is the author
if (user?.id === author_id && onDelete) {
  menuItems.push({
    name: "Delete",
    icon: "/deletelogo.png",
    action: () => onDelete(),
  });
}


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

          {/* Menu */}
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

         {/* Image (opens popup) */}
                          <div
                            className="mt-2 block rounded-[14px] overflow-hidden cursor-pointer"
                            style={{ width: "290px", height: "216px" }}
                             onClick={(e) => {
                              e.stopPropagation();
                              onOpenContent && onOpenContent(); // 👈 open ContentPopup via parent
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

         {/* Bottom section */}
               <div
                 className="flex flex-col items-start bg-white/[0.05] rounded-[16px] backdrop-blur-md border border-white/10 shadow-[inset_0px_0px_4px_rgba(239,214,255,0.25)] mt-4"
                 style={{ width: "297px", height: "265px", padding: "17px 20px" }}
               >
                 {/* Type Label */}
                 <div className="flex items-center justify-center w-[80px] h-[32px] relative mb-2">
                   <div className="relative flex items-center justify-center w-[90px] h-[28px] rounded-full 
                     bg-[rgba(239,214,255,0.05)] backdrop-blur-[10px] 
                     shadow-[inset_0_0_4px_rgba(239,214,255,0.25)] isolate overflow-hidden"
                   >
                     <span
                       className={`absolute inset-0 rounded-full z-0 ${
                         {
                           post: "bg-[linear-gradient(89.65deg,rgba(255,140,0,0.15)_0%,#FFA500_50%,rgba(255,140,0,0.15)_100%)]",
                           mindmap: "bg-[linear-gradient(89.65deg,rgba(30,144,255,0.15)_0%,#1E90FF_50%,rgba(30,144,255,0.15)_100%)]",
                           research: "bg-[linear-gradient(89.65deg,rgba(34,197,94,0.15)_0%,#22C55E_50%,rgba(34,197,94,0.15)_100%)]",
                         }[type]
                       }`}
                     />
                     <span className="relative z-10">{type}</span>
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
               
                 {/* Spacer pushes votes/comments to bottom */}
                 <div className="flex-1" />
               
                 {/* Votes & Comments */}
                 <div className="flex flex-row items-center justify-between w-full h-[44px] mt-2">
                   <div className="flex flex-row items-center gap-2">
                     <button
                       onClick={() => setVotes(votes + 1)}
                       className="w-[24px] h-[24px] text-gray-400 hover:scale-105 transition"
                     >
                       <Image src="/uparrow.png" alt="Upvote" width={20} height={20} />
                     </button>
                     <span className="text-sm text-gray-400">{votes}</span>
                     <button
                       onClick={() => setVotes(votes - 1)}
                       className="w-[24px] h-[24px] text-gray-400 hover:scale-105 transition"
                     >
                       <Image src="/downarrow.png" alt="Downvote" width={20} height={20} />
                     </button>
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
