"use client";
import React, { useState, useCallback, useRef, useEffect, CSSProperties, Suspense } from "react";
import { useContent } from "@/hooks/useContent";
import { useCategories } from "@/hooks/useCategories";
import { useContentTags } from "@/hooks/useContentTags";
import { useTags } from "@/hooks/useTags";
import { useRouter } from "next/navigation";
import { CONTENT_STATUS } from "@/lib/enums";
import { useAuthContext } from "@/hooks/AuthProvider";
import { Node, Edge } from "reactflow";

// ✅ add this import at the top
// Use dynamic import for the component itself in the render function, but import types statically
import { Excalidraw, exportToCanvas } from "@excalidraw/excalidraw"; 
import "@excalidraw/excalidraw/index.css";
import {
  BinaryFileData,
  ExcalidrawImperativeAPI,
} from "@excalidraw/excalidraw/types";
import type { 
  ExcalidrawElement, 
  ExcalidrawTextElement, 
  ExcalidrawBindableElement,
  ExcalidrawArrowElement,
  FractionalIndex,
  ExcalidrawGenericElement
} from "@excalidraw/excalidraw/element/types";
import type { AppState } from "@excalidraw/excalidraw/types";

type Tag = {
  id: string;
  name: string;
};

// -----------------------------
interface MindmapContentProps {
  mindmapId?: string | null;
  initialTitle?: string;
  initialContentBody?: string;
  initialCategoryId?: string;
  initialTags?: Tag[];
  initialNodes?: Node[];
  initialEdges?: Edge[];
  // Using Record<string, BinaryFileData> for better file typing
  initialExcalidrawData?: { elements: ExcalidrawElement[]; appState: AppState; files?: Record<string, BinaryFileData> }; 
  isModalOpen?: boolean;
  setIsModalOpen?: (open: boolean) => void;
}

// Helper: Recursive deep clone
const deepCloneMutable = <T,>(obj: T): T => {  // ✅ FIXED: Added comma after <T> to avoid JSX confusion
  if (obj === null || typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return obj.map(deepCloneMutable) as T;  // ✅ FIXED: Changed 'as any' to 'as T' for better typing (avoids ESLint 'no-explicit-any')
  const cloned = {} as T;  // ✅ FIXED: Ensured 'cloned' is properly declared
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) { 
      cloned[key] = deepCloneMutable(obj[key]);
    }
  }
  return cloned;
};


// Define types for your input React Flow data
interface RFNodeData {
  label: string;
  color?: string;
}

interface RFNode {
  id: string;
  type?: "circle" | "rect" | "diamond" | "text" | string;  // Made optional to match Node
  position: { x: number; y: number };
  data: RFNodeData;
}

interface RFEdge {
  id: string;
  source: string;
  target: string;
}

// Updated helper: index is now a string (FractionalIndex)
const getBaseExcalidrawProps = (node: RFNode) => ({
  id: node.id,
  x: node.position.x,
  y: node.position.y,
  strokeColor: node.data.color || "#000000",
  backgroundColor: "transparent",
  fillStyle: "solid" as const,
  strokeWidth: 2,
  strokeStyle: "solid" as const,
  roughness: 1,
  opacity: 100,
  groupIds: [],
  seed: Math.floor(Math.random() * 1000000),
  angle: 0,
  boundElements: null,
  updated: Date.now(),
  isDeleted: false,
  version: 1,
  versionNonce: Math.floor(Math.random() * 1000000),
  index: "a0" as FractionalIndex,
  frameId: null,
  link: null,
  locked: false,
  roundness: null,
});


const convertToExcalidrawElements = (nodes: RFNode[], edges: RFEdge[]): ExcalidrawElement[] => {
  const elements: ExcalidrawElement[] = [];

  nodes.forEach((node) => {
    const nodeType = node.type || "rect";  // ✅ FIXED: Provide default for optional type
    let shape: ExcalidrawBindableElement; 
    const baseProps = getBaseExcalidrawProps(node);

    switch (nodeType) {
      case "circle":
        shape = { ...baseProps, type: "ellipse", width: 80, height: 80, roundness: { type: 2 } };  // ✅ FIXED: Removed 'as const' for roundness
        break;
      case "rect":
        shape = { ...baseProps, type: "rectangle", width: 100, height: 50, roundness: null };
        break;
      case "diamond":
        shape = { ...baseProps, type: "diamond", width: 100, height: 50, roundness: { type: 3 } };
        break;
      case "text":
        const textProps: ExcalidrawTextElement = {
          ...baseProps, 
          type: "text", 
          text: node.data.label, 
          width: 100, 
          height: 50,
          fontSize: 14,
          textAlign: "center" as const,  // ✅ FIXED: Added 'as const' for exact type
          verticalAlign: "middle" as const,  // ✅ FIXED: Ensured valid value
          containerId: null,
          // ✅ FIXED: Add missing required properties
          fontFamily: 1,  // Default font family ID
          originalText: node.data.label,  // Usually same as text
          autoResize: true,  // Allow auto-resizing
          lineHeight: 1.25 as number & { _brand: "unitlessLineHeight"; },  // Default line height
        };
        shape = textProps;
        break;
      default:
        shape = { ...baseProps, type: "rectangle", width: 100, height: 50, roundness: null };
    }
    elements.push(shape);

    if (nodeType !== "text") {
      const textLabel: ExcalidrawTextElement = {
        ...getBaseExcalidrawProps(node), 
        id: `${node.id}-text`,
        type: "text",
        x: node.position.x + 10,
        y: node.position.y + 15,
        width: 80,
        height: 20,
        text: node.data.label,
        fontSize: 14,
        textAlign: "left" as const,  // ✅ FIXED: Added 'as const'
        verticalAlign: "top" as const,  // ✅ FIXED: Ensured valid value
        containerId: null,
         // ✅ FIXED: Add missing required properties
        fontFamily: 1,  // Default font family ID
        originalText: node.data.label,  // Usually same as text
        autoResize: true,  // Allow auto-resizing
        lineHeight: 1.25 as number & { _brand: "unitlessLineHeight"; },   // Default line height
      };
      elements.push(textLabel);
    }
  });

  edges.forEach((edge) => {
    const sourceNode = nodes.find(n => n.id === edge.source);
    const targetNode = nodes.find(n => n.id === edge.target);

    if (sourceNode && targetNode) {
      const arrow: ExcalidrawArrowElement = {
        ...getBaseExcalidrawProps(sourceNode), 
        id: edge.id,
        type: "arrow",
        x: sourceNode.position.x + 50,
        y: sourceNode.position.y + 25,
        width: targetNode.position.x - sourceNode.position.x,
        height: targetNode.position.y - sourceNode.position.y,
        points: [[0, 0], [targetNode.position.x - sourceNode.position.x, targetNode.position.y - sourceNode.position.y]] as const,  // ✅ FIXED: Added 'as const' for readonly tuples
        strokeColor: "#000",
        roundness: { type: 2 },  // ✅ FIXED: Removed 'as const'
        startBinding: null,
        endBinding: null,
        lastCommittedPoint: null,
        startArrowhead: null,
        endArrowhead: "arrow",
        elbowed: false,  // For straight arrows
      };
      elements.push(arrow);
    }
  });

  return elements;
};


// -----------------------------
// Mindmap Component (updated for Excalidraw)
function MindmapContent({
  mindmapId,
  initialTitle = "",
  initialContentBody = "",
  initialCategoryId = "",
  initialTags = [],
  initialNodes = [{ id: "1", type: "circle", data: { label: "Central Node", color: "#fff" }, position: { x: 400, y: 100 }, draggable: true }],
  initialEdges = [],
  initialExcalidrawData, // New prop
  isModalOpen: externalIsModalOpen,
  setIsModalOpen: externalSetIsModalOpen,
}: MindmapContentProps) {
  // ✅ Fixed: Deep clone and normalize initialData to ensure mutability and correct types
  const initialData = initialExcalidrawData 
  ? (() => {
      const cloned = JSON.parse(JSON.stringify(initialExcalidrawData));
      // Ensure appState is a plain, mutable object
      cloned.appState = { ...cloned.appState };
      if (!Array.isArray(cloned.appState.collaborators)) {
        cloned.appState.collaborators = [];
      }
      // Ensure files is a plain, mutable object
      if (cloned.files) {
        cloned.files = { ...cloned.files };
      }
      return cloned;
    })()
  : { 
      elements: convertToExcalidrawElements(initialNodes, initialEdges), 
      appState: {}, 
      files: {} // Default empty files
    };


  // Initialize state with initialData to keep local state in sync from the start
  const [excalidrawElements, setExcalidrawElements] = useState<ExcalidrawElement[]>(initialData.elements);
  const [appState, setAppState] = useState<AppState>(initialData.appState);
  const [files, setFiles] = useState<Record<string, BinaryFileData>>(initialData.files || {});
  const excalidrawRef = useRef<ExcalidrawImperativeAPI | null>(null);


  // Removed: useEffect for setting state based on initialExcalidrawData (no longer needed)
  // Removed: useEffect for syncing state back to Excalidraw (unnecessary, as Excalidraw manages its own scene)

  const { token } = useAuthContext();
  const { createContent, updateContent } = useContent({ type: "mindmap" });

  // -----------------------------
  const { categories, loading: loadingCategories } = useCategories();
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>(initialCategoryId);
  // -----------------------------
  const router = useRouter();
  // -----------------------------
  // Tags (unchanged)
  const { tags: allTags = [] } = useTags();
  const [tagQuery, setTagQuery] = useState("");
  const [selectedTags, setSelectedTags] = useState<Tag[]>(initialTags);
  const [searchResults, setSearchResults] = useState<Tag[]>([]);
  const { tags: fetchedTags, fetchTags } = useContentTags();
  useEffect(() => {
    if (mindmapId) fetchTags(mindmapId);
  }, [mindmapId]);
  useEffect(() => {
    if (fetchedTags.length > 0) {
      setSelectedTags(fetchedTags);
    }
  }, [fetchedTags]);
  const handleTagInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setTagQuery(value);
    if (value.trim()) {
      const filteredTags = allTags.filter(tag =>
        tag.name.toLowerCase().includes(value.toLowerCase())
      );
      setSearchResults(filteredTags);
    } else {
      setSearchResults([]);
    }
  };
  const handleAddTag = (tag: Tag) => {
    if (!selectedTags.some(t => t.id === tag.id)) {
      setSelectedTags(prev => [...prev, tag]);
    }
    setTagQuery("");
    setSearchResults([]);
  };
  const handleRemoveTag = (tagId: string) => {
    setSelectedTags(prev => prev.filter(t => t.id !== tagId));
  };
  const tag_ids = selectedTags.map(tag => tag.id);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  // -----------------------------
  // Modal State (fixed syntax error)
  const [internalIsModalOpen, setInternalIsModalOpen] = useState(false);
  // ✅ Fixed: Corrected syntax (was `!==  ?` – now `!== undefined ?`)
  const isModalOpen = externalIsModalOpen !== undefined ? externalIsModalOpen : internalIsModalOpen;
  const setIsModalOpen = externalSetIsModalOpen || setInternalIsModalOpen;
  const [title, setTitle] = useState(initialTitle);
  const [description, setDescription] = useState(initialContentBody);
  const [saving, setSaving] = useState(false);

  // -----------------------------
  // Excalidraw Handlers
  const onChange = useCallback((elements: readonly ExcalidrawElement[], state: AppState, files: Record<string, BinaryFileData>) => { // ✅ Fixed: Accept files parameter
    setExcalidrawElements([...elements]);
    setAppState(state);
    setFiles(files); // ✅ Fixed: Update files state
  }, []);

  

  // -----------------------------
  // Save Mindmap (Updated for Excalidraw)
  const handleSave = useCallback(async () => {
    if (!title) return alert("Please enter a title!");
    if (!selectedCategoryId) return alert("Please select a category!");
    if (!token) return alert("❌ You must be logged in to save!");

    setSaving(true);
    try {
      const mindmapData = { elements: excalidrawElements, appState, files }; // Serialize Excalidraw scene
      const dataToSend = {
        title,
        content_body: description,
        excalidraw_data: mindmapData,
        category_id: selectedCategoryId,
        tag_ids,
        status: CONTENT_STATUS.PUBLISHED,
      };
      if (mindmapId) {
        await updateContent(mindmapId, dataToSend, token);
      } else {
        await createContent(dataToSend, token);
      }
      router.push("/dashboard/mindmaps");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Unknown error";
      alert(`Error: ${message}`);
    } finally {
      setSaving(false);
    }
  }, [title, description, selectedCategoryId, excalidrawElements, appState, files, token, createContent, updateContent, tag_ids, mindmapId, router]); // ✅ Added files to deps

  // Draft (similar to save)
  const handleDraft = useCallback(async () => {
    if (!title) return alert("Please enter a title!");
    if (!selectedCategoryId) return alert("Please select a category!");
    if (!token) return alert("❌ You must be logged in to save as draft!");

    setSaving(true);
    try {
      const mindmapData = { elements: excalidrawElements, appState, files }; // ✅ Fixed: Include files
      const dataToSend = {
        title,
        content_body: description,
        excalidraw_data: mindmapData,
        category_id: selectedCategoryId,
        tag_ids,
        status: CONTENT_STATUS.DRAFT,
      };
      if (mindmapId) {
        await updateContent(mindmapId, dataToSend, token);
      } else {
        await createContent(dataToSend, token);
      }
      router.push("/dashboard/mindmaps/drafts");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Unknown error";
      alert(`Error: ${message}`);
    } finally {
      setSaving(false);
    }
  }, [title, description, selectedCategoryId, excalidrawElements, appState, files, token, createContent, updateContent, tag_ids, mindmapId, router]); // ✅ Added files to deps

  // -----------------------------
  // Export PNG (using Excalidraw's export)
  const exportPng = useCallback(async () => {
    if (!excalidrawRef.current) return;
    const canvas = await exportToCanvas({
      elements: excalidrawElements,
      appState,
      files, // Use the state
    });
    const link = document.createElement("a");
    link.href = canvas.toDataURL("image/png");
    link.download = "mindmap.png";
    link.click();
  }, [excalidrawElements, appState, files]); // ✅ Added files to deps

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh" }}>
      {/* Enhanced Toolbar */}
      

   
<div style={{ flex: 1, position: "relative", backgroundColor: "#0f172a" }}>
  <Excalidraw
    {...{ ref: excalidrawRef }}
    initialData={{ elements: excalidrawElements, appState, files }}
    onChange={onChange}
    theme="dark"
    UIOptions={{
      canvasActions: {
        export: false, // hide default export button
      },
    }}
  />
</div>

      {/* Save Modal */}
      {isModalOpen && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 999,
            padding: "16px",
          }}
        >
          <div
            className="relative custom-scrollbar isolate bg-white/[0.05] border border-[rgba(80,80,80,0.24)] shadow-[inset_0px_0px_7px_rgba(255,255,255,0.16)] backdrop-blur-[37px] rounded-[16px] overflow-y-auto w-full max-w-[711px] min-h-[400px] max-h-[90vh]"
            style={{
              padding: "20px",
              display: "flex",
              flexDirection: "column",
              gap: "16px",
            }}
          >
            {/* Header with title + close button */}
            <div className="flex items-center justify-between mb-2 sm:mb-4">
              <h1 className="m-0 text-lg sm:text-xl text-left">Mind Map Create</h1>
              <button
                onClick={() => setIsModalOpen(false)}
                className="w-[24px] h-[24px] flex items-center justify-center rounded-full bg-white text-black font-bold text-sm hover:bg-gray-200 transition"
              >
                ×
              </button>
            </div>
            
            {/* Title label + input */}
            <div className="flex flex-col items-start w-full gap-2">
              <label className="text-sm sm:text-base font-medium text-left">Title</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter title"
                className="w-full p-2 sm:p-3 border border-white/10 rounded-md bg-transparent text-white text-sm sm:text-base"
              />
            </div>

            {/* Category Select */}
            <div className="relative w-full flex flex-col items-start gap-2">
              <label className="text-sm sm:text-base font-medium text-left text-white">Category</label>
              <div
            
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex justify-between items-center p-2 sm:p-3 bg-white/10 border border-white/20 rounded-lg text-white text-sm cursor-pointer transition hover:bg-white/20 w-full"
              >
                {selectedCategoryId
                  ? categories.find((cat) => cat.id === selectedCategoryId)?.name
                  : loadingCategories
                  ? "Loading categories..."
                  : "Select a category"}
            
                <span className="ml-2 text-xs opacity-70">▼</span>
              </div>
              {dropdownOpen && (
                <div className="absolute top-full left-0 w-full mt-1 bg-black/80 border border-white/20 rounded-lg backdrop-blur-2xl shadow-[0_0_15px_rgba(0,0,0,0.4)] z-50 max-h-48 overflow-y-scroll">
                  <style>{`div::-webkit-scrollbar { display: none; }`}</style>
                  <div
                    onClick={() => {
                      setSelectedCategoryId("");
                      setDropdownOpen(false);
                    }}
                    className="p-2 text-white text-sm hover:bg-white/20 cursor-pointer"
                  >
                    Select a category
                  </div>
                  {categories.map((cat) => (
                    <div
                      key={cat.id}
                      onClick={() => {
                        setSelectedCategoryId(cat.id);
                        setDropdownOpen(false);
                      }}
                      className="p-2 text-white text-sm hover:bg-white/20 cursor-pointer"
                    >
                      {cat.name}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Tags */}
            <div style={{ display: "flex", flexDirection: "column", gap: "6px", width: "100%" }}>
              <label style={{ fontSize: "16px", fontWeight: 500 }}>Tags</label>
              <div style={{
                position: "relative",
                width: "auto",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: "6px",
                background: "",
                padding: "8px",
                minHeight: "44px",
                display: "flex",
                flexDirection: "column",
              }}>
                <div style={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: "4px",
                  alignItems: "center",
                  flex: 1,
                }}>
                  {selectedTags.map(tag => (
                    <div
                      key={tag.id}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        padding: "4px 8px",
                        borderRadius: "12px",
                        background: "rgba(145, 158, 171, 0.08)",
                        color: "white",
                        fontSize: "12px",
                        border: "",
                        maxWidth: "150px",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      <span style={{ flex: 1, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                        {tag.name}
                      </span>
                      <span
                        style={{
                          marginLeft: "6px",
                          cursor: "pointer",
                          fontWeight: "bold",
                          flexShrink: 0,
                          padding: "0 2px",
                        }}
                        onClick={() => handleRemoveTag(tag.id)}
                        title="Remove tag"
                        className="w-[15px] h-[15px] flex items-center justify-center rounded-full bg-white text-black font-bold text-sm hover:bg-gray-200 transition"
                      >
                        ×
                      </span>
                    </div>
                  ))}
                  <input
                    type="text"
                    value={tagQuery}
                    onChange={handleTagInputChange}
                    placeholder={selectedTags.length > 0 ? "" : "Search tags..."}
                    className="flex-1 min-w-[100px] sm:min-w-[120px] border-none outline-none bg-transparent text-white text-sm sm:text-base p-1 sm:p-2"
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && tagQuery.trim()) {
                        const matchedTag = searchResults.find(t => t.name.toLowerCase() === tagQuery.toLowerCase().trim());
                        if (matchedTag) {
                          handleAddTag(matchedTag);
                        }
                        e.preventDefault();
                      }
                    }}
                  />
                </div>
                {tagQuery && searchResults.length > 0 && (
                  <div className="absolute top-full left-0 right-0 bg-black/80 text-white max-h-32 sm:max-h-40 overflow-y-auto rounded-md z-1000 border border-white/10 mt-1">
                    {searchResults.map(tag => (
                      <div
                        key={tag.id}
                        className="p-2 sm:p-3 cursor-pointer border-b border-white/5 last:border-b-0"
                        onClick={() => handleAddTag(tag)}
                      >
                        {tag.name}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Description */}
            <div className="flex flex-col items-start w-full gap-2">
              <label className="text-sm sm:text-base font-medium text-left">Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Enter description"
                rows={3}
                className="w-full p-2 sm:p-3 border border-white/10 rounded-md bg-transparent text-white text-sm sm:text-base resize-none min-h-[80px] sm:min-h-[100px]"
              />
            </div>

            {/* Buttons */}
            <div className="flex justify-end w-full mt-4 gap-2 sm:gap-3">
              <button
                onClick={() => setIsModalOpen(false)}
                className="relative w-16 sm:w-20 h-8 sm:h-9 rounded-full bg-white/[0.05] border border-white/10 shadow-[inset_0_0_4px_rgba(239,214,255,0.25)] backdrop-blur-[10px] text-white font-bold text-xs sm:text-sm flex items-center justify-center transition hover:scale-105 overflow-hidden"
              >
                <span className="absolute inset-0 rounded-full bg-[radial-gradient(circle,rgba(90, 0, 0, 0.5)_0%,transparent_70%)] blur-md" />
                <span className="relative z-10">Cancel</span>
              </button>
              <button
                onClick={handleDraft}
                disabled={saving}
                className="relative w-16 sm:w-20 h-8 sm:h-9 rounded-full bg-white/[0.05] border border-white/10 shadow-[inset_0_0_4px_rgba(239,214,255,0.25)] backdrop-blur-[10px] text-white font-bold text-xs sm:text-sm flex items-center justify-center transition hover:scale-105 overflow-hidden disabled:opacity-50"
              >
                <span className="absolute inset-0 rounded-full bg-[radial-gradient(circle,rgba(90, 0, 0, 0.5)_0%,transparent_70%)] blur-md" />
                <span className="relative z-10">Draft</span>
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="relative w-16 sm:w-20 h-8 sm:h-9 rounded-full bg-white/[0.05] border border-white/10 shadow-[inset_0_0_4px_rgba(239,214,255,0.25)] backdrop-blur-[10px] flex items-center justify-center transition hover:scale-105 overflow-hidden disabled:opacity-50"
                style={{
                  fontFamily: "Public Sans, sans-serif",
                  fontStyle: "normal",
                  fontWeight: 700,
                  fontSize: "12px",
                  lineHeight: "20px",
                  color: "#5BE49B",
                  textAlign: "center",
                }}
              >
                <span className="absolute inset-0 rounded-full bg-[radial-gradient(circle,rgba(119,237,139,0.5)_0%,transparent_70%)] blur-md" />
                <span className="relative z-10">{saving ? "Saving..." : "Save"}</span>
              </button>
            </div>
          </div>
        </div>
      )}
         <style jsx global>{`
  .excalidraw-toolbar {
    display: flex !important;
    flex-direction: row !important;
    flex-wrap: wrap !important;
    gap: 8px !important;
    padding: 8px !important;
  }
  .excalidraw-toolbar button {
    width: 36px !important;
    height: 36px !important;
    font-size: 20px !important;
    display: flex !important;
    align-items: center !important;
    justify-content: center !important;
  }
  .excalidraw-canvas {
    background: #000 !important; /* black background for canvas area */
  }
`}</style>
   
    </div>
  );
}

// -----------------------------
// Main Page
// -----------------------------
export default MindmapContent;