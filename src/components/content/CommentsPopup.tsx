"use client";
import { useState, useEffect, useRef, useMemo } from "react";
import Image from "next/image";
import { useReferences } from "@/hooks/useReferences";
import { useContentTags } from "@/hooks/useContentTags";
import React from "react";

// ✅ Add Excalidraw imports for viewing mindmaps
import "@excalidraw/excalidraw/index.css";
import type { ExcalidrawElement } from "@excalidraw/excalidraw/element/types";
import type { AppState, BinaryFileData } from "@excalidraw/excalidraw/types";
import dynamic from 'next/dynamic';


type ApiComment = {
  id: string;
  text: string;
  user_id?: string;
  parent_id?: string | null;
  created_at?: string | null;
  authorEmail?: string | null;
  authorAvatar?: string | null;
  replies?: ApiComment[];
  author?: string | null;
  date?: string | null;
 
};

interface CommentsPopupProps {
  id: string;
  title: string;
  content_body: string;
  comments: ApiComment[];
  excalidraw_data?: Record<string, unknown>;
  onClose: () => void;
  onAddComment: (text: string, parentId?: string) => Promise<void>;
}

export default function CommentsPopup({
  id,
  title,
  content_body,
  comments = [],
  excalidraw_data,
  onClose,
  onAddComment,
}: CommentsPopupProps) {
  const [newCommentText, setNewCommentText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeReplies, setActiveReplies] = useState<{ [key: string]: string }>({});
  const overlayRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (id) fetchTags(id);
  }, [id]);

  const { references, loading: refsLoading, error: refsError } = useReferences(id);
  const { tags, loading: tagsLoading, error: tagsError, fetchTags } = useContentTags();

    useEffect(() => {
      if (id) fetchTags(id);
    }, [id]);



  useEffect(() => {
    const handleOverlayClick = (e: MouseEvent) => {
      if (overlayRef.current && e.target === overlayRef.current) onClose();
    };
    document.addEventListener("mousedown", handleOverlayClick);
    return () => document.removeEventListener("mousedown", handleOverlayClick);
  }, [onClose]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  const formatDate = (iso?: string | null) => {
    if (!iso) return "";
    try {
      const d = new Date(iso);
      return d.toLocaleString(undefined, {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
      });
    } catch {
      return iso;
    }
  };

  const getAuthorDisplay = (c: ApiComment) => {
    if (c.author && c.author.trim()) return c.author;
    if (c.authorEmail && c.authorEmail.includes("@")) return c.authorEmail.split("@")[0];
    if (c.authorEmail) return c.authorEmail;
    return "Unknown";
  };

  const handleSubmitComment = async () => {
    if (!newCommentText.trim()) return;
    setIsSubmitting(true);
    try {
      await onAddComment(newCommentText);
      setNewCommentText("");
    } catch (err) {
      console.error("Failed to submit comment:", err);
      alert("Failed to post comment.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReplySubmit = async (parentId: string) => {
    const text = activeReplies[parentId];
    if (!text?.trim()) {
      setActiveReplies((prev) => {
        const copy = { ...prev };
        delete copy[parentId];
        return copy;
      });
      return;
    }
    setIsSubmitting(true);
    try {
      await onAddComment(text, parentId);
      setActiveReplies((prev) => {
        const copy = { ...prev };
        delete copy[parentId];
        return copy;
      });
    } catch (err) {
      console.error("Failed to post reply:", err);
      alert("Failed to post reply.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleReplyInput = (commentId: string) => {
    setActiveReplies((prev) => {
      const current = prev[commentId];
      if (current !== undefined) {
        const copy = { ...prev };
        delete copy[commentId];
        return copy;
      } else {
        return { ...prev, [commentId]: "" };
      }
    });
  };

  const CommentItem = ({ comment, level = 0 }: { comment: ApiComment; level?: number }) => {
    const isActive = activeReplies[comment.id] !== undefined;
    const [replyText, setReplyText] = useState(activeReplies[comment.id] || "");
    const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  
    useEffect(() => {
      setReplyText(activeReplies[comment.id] || "");
    }, [activeReplies[comment.id], comment.id]);
  
    useEffect(() => {
      if (isActive && textareaRef.current) {
        textareaRef.current.focus();
        textareaRef.current.selectionStart = textareaRef.current.value.length;
        textareaRef.current.selectionEnd = textareaRef.current.value.length;
      }
    }, [isActive]);
  
    return (
      <div className={`flex gap-1 p-2 bg-transparent border-b border-[#918AAB26]`}>
        <Image
          src={comment.authorAvatar || "/person.jpg"}
          alt={getAuthorDisplay(comment)}
          width={40}
          height={40}
          className="w-10 h-10 rounded-full object-cover flex-shrink-0"
        />
  
        <div className="flex-1 min-w-0">
          <div className="flex justify-between items-start flex-wrap gap-2">
            <div>
              <div className="flex flex-col gap-0">
                <span className="text-white font-semibold text-sm">
                  {getAuthorDisplay(comment)}
                </span>
                <span className="text-gray-400 text-xs">
                  • {formatDate(comment.created_at ?? comment.date)}
                </span>
              </div>
            </div>
  
            {/* 🟢 Show Reply button only for top-level comments */}
            {level === 0 && (
              <button
                onClick={() => toggleReplyInput(comment.id)}
                className="relative w-[80px] h-[24px] rounded-full bg-white/[0.05] border border-white/10 shadow-[inset_0_0_4px_rgba(239,214,255,0.25)] backdrop-blur-[10px] text-white font-bold text-xs flex items-center justify-center transition hover:scale-[1.02] overflow-hidden"
                disabled={isSubmitting}
              >
                <span className="absolute inset-0 rounded-full bg-[radial-gradient(circle,rgba(255,255,255,0.5)_0%,transparent_70%)] blur-md" />
                <span className="relative z-10">Reply</span>
              </button>
            )}
          </div>
  
          <p className="text-white text-sm mt-1 mb-2">{comment.text}</p>
  
          {/* 🟢 Reply input only for top-level */}
          {level === 0 && isActive && (
            <div className="flex flex-col w-full gap-2 mt-2 p-3 bg-transparent rounded-lg">
              <textarea
                ref={textareaRef}
                value={replyText}
                onChange={(e) => {
                  const val = e.target.value;
                  setReplyText(val);
                  setActiveReplies((prev) => ({ ...prev, [comment.id]: val }));
                }}
                placeholder={`Reply to ${getAuthorDisplay(comment)}...`}
                className="w-full h-[60px] p-2 bg-transparent border border-[#918AAB26] rounded-[4px] text-white text-sm resize-vertical focus:outline-none"
                rows={2}
                maxLength={200}
                disabled={isSubmitting}
              />
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => toggleReplyInput(comment.id)}
                  className="text-gray-400 text-xs hover:text-white"
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleReplySubmit(comment.id)}
                  className="w-[80px] h-[28px] rounded-full bg-white/[0.05] border border-white/10 shadow-[inset_0_0_4px_rgba(239,214,255,0.25)] backdrop-blur-[10px] text-white font-bold text-xs flex items-center justify-center transition hover:scale-[1.02]"
                  disabled={isSubmitting || !replyText.trim()}
                >
                  {isSubmitting ? "..." : "Post Reply"}
                </button>
              </div>
            </div>
          )}
  
          {/* 🔁 Nested replies (keep showing them, just no reply button inside) */}
          {(comment.replies ?? []).length > 0 && (
            <div className={`mt-3 ${level > 0 ? "ml-3" : "ml-6"}`}>
              {(comment.replies ?? []).map((r) => (
                <CommentItem key={r.id} comment={r} level={level + 1} />
              ))}
            </div>
          )}
        </div>
      </div>
    );
  };
  

  return (
    <>
      <div
        ref={overlayRef}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
      >
        <div
          className="relative custom-scrollbar flex flex-col items-center p-4 gap-4 isolate bg-white/[0.05] border border-[rgba(80,80,80,0.24)] shadow-[inset_0px_0px_7px_rgba(255,255,255,0.16)] backdrop-blur-[37px] rounded-[16px] overflow-y-auto overflow-x-hidden"
          style={{ width: "95%", maxWidth: "920px", maxHeight: "90vh", boxSizing: "border-box", paddingRight: "12px" }}
        >
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-[20px] h-[20px] flex items-center justify-center rounded-full bg-white text-black font-bold text-xs hover:bg-gray-200 transition"
          >
            ×
          </button>

           {/* Title */}
          <div className="flex justify-center items-center mb-4 w-full">
            <h2
              className="font-publicSans font-bold text-[24px] leading-[36px] flex items-center justify-left text-left"
              style={{
                width: "100%",
                maxWidth: "853px",
                background:
                  "radial-gradient(137.85% 214.06% at 50% 50%, #FFFFFF 0%, #5BE49B 50%, rgba(255, 255, 255, 0.4) 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
                fontWeight: 700,
                fontSize: "24px",
                lineHeight: "36px",
                fontFamily: "'Public Sans', sans-serif",
              }}
            >
              {title}
            </h2>
          </div>

           {/* 🧠 Mind Map Viewer (Replaced ReactFlow with Excalidraw) */}
          
                    {excalidraw_data && (
                    <div
                      style={{
                        width: "100%",
                        maxWidth: "855px",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "flex-start", // ✅ ensures label + box align left
                      }}
                    >
                      <label
                        style={{
                          fontSize: "16px",
                          fontWeight: 500,
                          color: "white",
                          marginBottom: "6px",
                          textAlign: "left",
                        }}
                      >
                        Mindmap
                      </label>
              
                      <div
                        style={{
                          width: "100%",
                          maxWidth: "855px",
                          height: "415px",
                          border: "1px solid rgba(80, 80, 80, 0.24)",
                          borderRadius: "16px",
                          background: "rgba(255, 255, 255, 0.02)",
                          padding: "8px",
                          marginBottom: "8px",
                        }}
                        
                      >
                 
          
                        <div style={{ width: "100%", height: "400px" }}>
                          <React.Suspense fallback={<div className="text-white text-sm">Loading mind map...</div>}>
                            {useMemo(() => {  // ✅ REPLACED: Wrapped in useMemo to prevent flicker
                              try {
                                // ✅ FIXED: Clone and then deep freeze the data to prevent modifications
                                const rawData = JSON.parse(JSON.stringify(excalidraw_data));
                                const Excalidraw = dynamic(() => import('@excalidraw/excalidraw').then(mod => mod.Excalidraw), { ssr: false });
          
                                // Ensure it's in Excalidraw format
                                if (!rawData || typeof rawData !== "object" || !Array.isArray(rawData.elements)) {
                                  throw new Error("Invalid Excalidraw data structure");
                                }
          
                                // Deep freeze the data to make it immutable
                                const deepFreeze = (obj: any): any => {
                                  if (obj === null || typeof obj !== 'object') return obj;
                                  if (Array.isArray(obj)) {
                                    obj.forEach(deepFreeze);
                                  } else {
                                    Object.getOwnPropertyNames(obj).forEach(key => {
                                      if (obj[key] && typeof obj[key] === 'object') {
                                        deepFreeze(obj[key]);
                                      }
                                    });
                                  }
                                  return Object.freeze(obj);
                                };
          
                                const initialData = {
                                  elements: deepFreeze(rawData.elements) as ExcalidrawElement[],
                                  appState: deepFreeze(rawData.appState || {}) as AppState,
                                  files: deepFreeze(rawData.files || {}) as Record<string, BinaryFileData>,
                                };
          
                                return (
                                  <Excalidraw
                                    initialData={initialData}
                                    viewModeEnabled={true}
                                    theme="dark"
                                    UIOptions={{
                                      canvasActions: { export: false },
                                      tools: { image: false },
                                    }}
                                  />
                                );
                              } catch (e) {
                                console.error("Error rendering mindmap:", e);
                                return (
                                  <div className="text-red-400 text-sm">
                                    ⚠️ Unable to display mindmap due to data compatibility issues. Error: {e instanceof Error ? e.message : 'Unknown error'}
                                  </div>
                                );
                              }
                            }, [excalidraw_data])}  {/* ✅ Memoize based on excalidraw_data */}
                          </React.Suspense>
                        </div>
                      </div>
                       </div>
                    )}

          {/* Content Body */}
          {content_body && (
            <div
              style={{ maxWidth: "853px", width: "100%"}}
              dangerouslySetInnerHTML={{ __html: content_body }}
            />
          )}

          {/* New Comment */}
          <div className="w-full mb-4 flex flex-col items-center">


             {/* Tags section */}
          {tags && tags.length > 0 && (
            <div style={{ display: "flex", flexDirection: "column", gap: "6px", width: "100%", maxWidth: "855px" }}>
              <label style={{ fontSize: "16px", fontWeight: 500, color: "white" }}>Tags</label>

              <div
                style={{
                  position: "relative",
                  width: "100%",
                  border: "1px solid rgba(80, 80, 80, 0.24)",
                  borderRadius: "16px",
                  background: "rgba(255, 255, 255, 0.05)",
                  padding: "8px",
                  height: "64px",
                  minHeight: "44px",
                  display: "flex",
                  flexDirection: "column",
                  marginBottom: "8px",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    flexWrap: "wrap",
                    gap: "4px",
                    alignItems: "center",
                    flex: 1,
                  }}
                >
                  {tags.map((tag) => (
                    <div
                      key={tag.id}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        padding: "4px 8px",
                        borderRadius: "99px",
                        background: "rgba(145, 158, 171, 0.12)",
                        color: "white",
                        height: "32px",
                        fontSize: "12px",
                        maxWidth: "150px",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      <span
                        style={{
                          flex: 1,
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                        }}
                      >
                        {tag.name}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

                {/* 🟢 References section (below tags, styled like a vertical list of transparent pills) */}
            {references.length > 0 && (
              <div style={{ display: "flex", flexDirection: "column", gap: "6px", width: "100%", maxWidth: "855px" }}>
                <label style={{ fontSize: "16px", fontWeight: 500, color: "white" }}>References</label>

                <div
                  style={{
                    position: "relative",
                    width: "100%",
                    border: "1px solid rgba(80, 80, 80, 0.24)",
                    borderRadius: "16px",
                    background: "rgba(255, 255, 255, 0.05)",
                    padding: "8px",
                    minHeight: "44px",
                    display: "flex",
                    flexDirection: "column",
                    gap: "6px",
                    marginBottom: "8px",
                  }}
                >
                  {references.map((ref) => (
                    <div
                      key={ref.id}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        padding: "6px 10px",
                        borderRadius: "16px", // keep pill shape
                        background: "transparent", // transparent background
                        border: "1px solid rgba(80, 80, 80, 0.24)", // ⚪ soft white border
                        color: "#5BE49B", // 🟢 green text
                        height: "32px",
                        fontSize: "12px",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      <span
                        style={{
                          flex: 1,
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                        }}
                      >
                        {ref.text}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

           
            {/* Label with superscript counter */}
<div className="w-full max-w-[855px] flex justify-start items-center mb-2 px-2 sm:px-0">
  <label className="text-white font-bold text-[18px] sm:text-[20px] leading-[22px] font-public-sans">
    Comments
    <sup className="text-gray-400 text-xs ml-1">{200 - newCommentText.length}</sup>
  </label>
</div>

            

            {/* Textarea */}
            <textarea
              value={newCommentText}
  onChange={(e) => setNewCommentText(e.target.value)}
  placeholder="Write your comment..."
  className="w-full max-w-[855px] h-[120px] p-3 bg-transparent border border-[#918AAB26] rounded text-white text-sm resize-none focus:outline-none disabled:opacity-50"
  maxLength={220}
  disabled={isSubmitting}
            />

            {/* Submit button */}
           <div className="flex justify-start mt-2 w-full max-w-[855px] px-2 sm:px-0">
            <button
              onClick={handleSubmitComment}
              disabled={isSubmitting || !newCommentText.trim()}
              className="relative w-[120px] h-[36px] rounded-full bg-white/[0.05] border border-white/10 shadow-[inset_0_0_4px_rgba(239,214,255,0.25)] backdrop-blur-[10px] text-white font-bold text-xs flex items-center justify-center transition hover:scale-[1.02] overflow-hidden disabled:opacity-50"
                        >
                <span className="absolute inset-0 rounded-full bg-[radial-gradient(circle,rgba(119,237,139,0.5)_0%,transparent_70%)] blur-md" />
                <span className="relative z-10">{isSubmitting ? "..." : "Post Comment"}</span>
              </button>
            </div>
          </div>

         {/* Comments List */}
            <div className="flex flex-col items-center w-full px-2 sm:px-0">
              {comments.length > 0 ? (
                comments.map((c) => (
                  <div key={c.id} className="w-full max-w-[853px]">
                    <CommentItem comment={c} />
                  </div>
                ))
              ) : (
                <p className="text-gray-400">No comments yet.</p>
              )}
            </div>
        </div>
      </div>

      <style jsx>{`
        .custom-scrollbar {
          width: 100%;
          box-sizing: border-box;
          border-radius: 16px;
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.12);
          border-radius: 3px;
        }
          div :global(ul) {
          list-style-type: disc;
          padding-left: 1.5rem;
        }
        div :global(ol) {
          list-style-type: decimal;
          padding-left: 1.5rem;
        }
         div :global(h1) {
          font-size: 1.5rem;
          font-weight: bold;
        }
        div :global(h2) {
          font-size: 1.25rem;
          font-weight: bold;
        }
        div :global(h3) {
          font-size: 1.1rem;
          font-weight: bold;
        }
         div :global(a.custom-link) {
          color: #105d81ff;
          text-decoration: underline;
          font-weight: 500;
          background-color: rgba(90, 205, 240, 0.1);
          border-radius: 3px;
          padding: 0 2px;
          transition: background 0.2s;
        }

        div :global(a.custom-link:hover) {
          background-color: rgba(90, 142, 240, 0.2);
        }
      `}</style>
    </>
  );
}