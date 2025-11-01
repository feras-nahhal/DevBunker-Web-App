// ContentPopup.tsx
"use client";

import { useEffect, useRef } from "react";
import { useReferences } from "@/hooks/useReferences";
import { useContentTags } from "@/hooks/useContentTags";
import { CONTENT_STATUS } from "@/lib/enums"; // NEW
import React from "react";
import ReactFlow, {
  Handle,
  Controls,
  Background,
  Position,
  NodeProps,
  StraightEdge,
  StepEdge,
  SmoothStepEdge,
  BezierEdge
} from "reactflow";
import "reactflow/dist/style.css";


interface ContentPopupProps {
  id: string;
  title: string;
  content_body: string;
  onClose: () => void;
  categoryName?: string[];
  created_at?: string;
  updated_at?: string;
  status?: CONTENT_STATUS;
  excalidraw_data?: Record<string, unknown>;

}

export default function ContentPopup({
  id,
  title,
  content_body,
  onClose,
  categoryName,
  created_at,
  updated_at,
  excalidraw_data,
  status
}: ContentPopupProps) {
  const overlayRef = useRef<HTMLDivElement>(null);

  

  const { references = [], loading: refsLoading, error: refsError } = useReferences(id) ?? {};
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

  return (
    <>
      <div
        ref={overlayRef}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
      >
        <div
          className="relative custom-scrollbar flex flex-col items-center p-4 gap-4 isolate bg-white/[0.05] border border-[rgba(80,80,80,0.24)] shadow-[inset_0px_0px_7px_rgba(255,255,255,0.16)] backdrop-blur-[37px] rounded-[16px] overflow-y-auto"
          style={{ width: "100%", maxWidth: "920px", maxHeight: "90vh", boxSizing: "border-box", paddingRight: "12px" }}
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

        
           {/* 🧠 Mind Map Viewer */}
            {excalidraw_data && (
            <div
                style={{
                width: "100%",
                maxWidth: "855px",
                height: "450px",
                border: "1px solid rgba(80, 80, 80, 0.24)",
                borderRadius: "16px",
                background: "rgba(255, 255, 255, 0.02)",
                padding: "8px",
                marginBottom: "8px",
                }}
            >
                <label
                style={{
                    fontSize: "16px",
                    fontWeight: 500,
                    color: "white",
                    display: "block",
                    marginBottom: "6px",
                }}
                >
                Mind Map
                </label>

                <div style={{ width: "100%", height: "400px" }}>
                {(() => {
                    try {
                    const data =
                        typeof excalidraw_data === "string"
                        ? JSON.parse(excalidraw_data)
                        : excalidraw_data;

                    const nodes = Array.isArray(data?.nodes) ? data.nodes : [];
                    const edges = Array.isArray(data?.edges) ? data.edges : [];

                    // ✅ Node types (same as before)
                    const nodeTypes = {
                        circle: ({ data }: NodeProps<{ label: string; color?: string }>) => (
                        <div
                            style={{
                            width: 60,
                            height: 60,
                            borderRadius: "50%",
                            backgroundColor: data.color || "#fff",
                            border: "2px solid #aaa",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            color: "#000",
                            fontWeight: 500,
                            position: "relative",
                            }}
                        >
                            <Handle type="target" position={Position.Left} style={{ background: "#888" }} />
                            {data.label}
                            <Handle type="source" position={Position.Right} style={{ background: "#888" }} />
                        </div>
                        ),

                        rect: ({ data }: NodeProps<{ label: string; color?: string }>) => (
                        <div
                            style={{
                            padding: "10px 16px",
                            borderRadius: "8px",
                            backgroundColor: data.color || "#fff",
                            border: "2px solid #aaa",
                            color: "#000",
                            textAlign: "center",
                            fontWeight: 500,
                            position: "relative",
                            }}
                        >
                            <Handle type="target" position={Position.Left} style={{ background: "#888" }} />
                            {data.label}
                            <Handle type="source" position={Position.Right} style={{ background: "#888" }} />
                        </div>
                        ),

                        diamond: ({ data }: NodeProps<{ label: string; color?: string }>) => (
                        <div
                            style={{
                            width: 70,
                            height: 70,
                            backgroundColor: data.color || "#fff",
                            transform: "rotate(45deg)",
                            border: "2px solid #aaa",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            color: "#000",
                            position: "relative",
                            }}
                        >
                            <Handle type="target" position={Position.Left} style={{ background: "#888" }} />
                            <span style={{ transform: "rotate(-45deg)" }}>{data.label}</span>
                            <Handle type="source" position={Position.Right} style={{ background: "#888" }} />
                        </div>
                        ),

                        text: ({ data }: NodeProps<{ label: string; color?: string }>) => (
                        <div
                            style={{
                            fontSize: "14px",
                            color: data.color || "#fff",
                            background: "transparent",
                            position: "relative",
                            }}
                        >
                            <Handle type="target" position={Position.Top} style={{ background: "#888" }} />
                            {data.label}
                            <Handle type="source" position={Position.Bottom} style={{ background: "#888" }} />
                        </div>
                        ),
                    };

                    // ✅ Register edge types
                    const edgeTypes = {
                        default: BezierEdge,
                        straight: StraightEdge,
                        step: StepEdge,
                        smoothstep: SmoothStepEdge,
                    };

                    return (
                        <ReactFlow
                        nodes={nodes}
                        edges={edges}
                        nodeTypes={nodeTypes}
                        edgeTypes={edgeTypes}
                        fitView
                        defaultEdgeOptions={{
                            type: "default", // fallback
                            style: { stroke: "#999", strokeWidth: 1.5 },
                        }}
                        >
                        <Background />
                        <Controls />
                        </ReactFlow>
                    );
                    } catch (e) {
                    console.error("Invalid excalidraw_data format:", e);
                    return (
                        <div className="text-red-400 text-sm">
                        ⚠️ Invalid mindmap data format
                        </div>
                    );
                    }
                })()}
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

         {/* 🗂️ Info Row: Category + Dates + Status */}
        {(categoryName || created_at || updated_at || status) && (
        <div
            style={{
            display: "flex",
            flexDirection: "column",
            gap: "6px",
            width: "100%",
            maxWidth: "855px",
            }}
        >
            <label style={{ fontSize: "16px", fontWeight: 500, color: "white" }}>
            Info
            </label>

            <div
            style={{
                position: "relative",
                width: "100%",
                border: "1px solid rgba(80, 80, 80, 0.24)",
                borderRadius: "16px",
                background: "rgba(255, 255, 255, 0.05)",
                padding: "8px 12px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                color: "white",
                fontSize: "13px",
                fontWeight: 500,
                flexWrap: "wrap",
                gap: "8px",
            }}
            >
            {/* Category */}
            {categoryName && categoryName.length > 0 && (
                <div
                style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    color: "#5BE49B",
                    minWidth: "150px",
                }}
                >
                <span style={{ opacity: 0.8 }}>Category:</span>
                <span
                    style={{
                    fontWeight: 600,
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    }}
                >
                    {categoryName.join(", ")}
                </span>
                </div>
            )}

            {/* Created Date */}
            {created_at && (
                <div style={{ color: "#5BE49B", minWidth: "150px" }}>
                <span style={{ opacity: 0.8 }}>Created:</span>{" "}
                {new Date(created_at).toLocaleDateString()}
                </div>
            )}

            {/* Updated Date */}
            {updated_at && (
                <div style={{ color: "#5BE49B", minWidth: "150px" }}>
                <span style={{ opacity: 0.8 }}>Updated:</span>{" "}
                {new Date(updated_at).toLocaleDateString()}
                </div>
            )}

            {/* Status */}
            {status && (
                <div
                style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    color:
                    status.toLowerCase() === "published"
                        ? "#5BE49B"
                        : status.toLowerCase() === "draft"
                        ? "#FFC107"
                        : "#E57373",
                    minWidth: "100px",
                    textTransform: "capitalize",
                }}
                >
                <span style={{ opacity: 0.8 }}>Status:</span>
                <span style={{ fontWeight: 600 }}>{status}</span>
                </div>
            )}
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
