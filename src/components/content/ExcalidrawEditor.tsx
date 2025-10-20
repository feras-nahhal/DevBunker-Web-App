"use client";

import {
  Plus,
  Square,
  Diamond,
  Circle,
  Trash2,
  Save,
  Camera,
  Edit,
} from "lucide-react";
import React, { useState, useCallback, useRef, useEffect, CSSProperties } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useContent } from "@/hooks/useContent";
import { useCategories } from "@/hooks/useCategories";
import { useContentTags } from "@/hooks/useContentTags";
import { useTags } from "@/hooks/useTags";
import { Edge, NodeProps, NodeResizer } from "reactflow";
import { useRouter } from "next/navigation"; // ✅ Add this import
import { Position } from "reactflow";
import ReactFlow, {
  ReactFlowProvider,
  useNodesState,
  useEdgesState,
  Node,
  NodeTypes,
  EdgeTypes,
  addEdge,
  Connection,
  Handle,
  MiniMap,
  Controls,
  Background,
  Panel,
  useReactFlow,
} from "reactflow";
import "reactflow/dist/style.css";
import html2canvas from "html2canvas";
import { CONTENT_STATUS } from "@/lib/enums";

// -----------------------------
type Tag = {
  id: string;
  name: string;
};

// -----------------------------
// Props for MindmapContent (to receive initial data from parent)
interface MindmapContentProps {
  mindmapId?: string | null;
  initialTitle?: string;
  initialContentBody?: string;
  initialCategoryId?: string;
  initialTags?: Tag[];
  initialNodes?: Node[];
  initialEdges?: Edge[];
}

// -----------------------------
// Node Components (unchanged)
export const CircleNode = ({ data, selected, dragging }: NodeProps<{ label: string; color?: string }>) => {
  const handleStyle: CSSProperties = { top: "50%" };
  return (
    <div
      style={{
        padding: "10px 20px",
        backgroundColor: data.color || "#fff",
        border: selected ? "3px solid #fff" : "2px solid #ccc",
        borderRadius: "50%",
        textAlign: "center",
        minWidth: "60px",
        cursor: dragging ? "grabbing" : "pointer",
        color: "#000",
        userSelect: "none",
        position: "relative",
      }}
    >
      <Handle type="target" position={Position.Left} style={handleStyle} />
      <Handle type="source" position={Position.Right} style={handleStyle} />
      {data.label}
      {selected && <NodeResizer color="#0e0e0eff" isVisible={selected} minWidth={50} minHeight={50} />} {/* ✅ Add resizer */}
    </div>
  );
};

export const RectNode = ({ data, selected, dragging }: NodeProps<{ label: string; color?: string }>) => {
  const handleStyle: CSSProperties = { top: "50%" };
  return (
    <div
      style={{
        padding: "10px 20px",
        backgroundColor: data.color || "#fff",
        border: selected ? "3px solid #fff" : "2px solid #ccc",
        borderRadius: "6px",
        textAlign: "center",
        minWidth: "80px",
        cursor: dragging ? "grabbing" : "pointer",
        color: "#000",
        userSelect: "none",
        position: "relative",
      }}
    >
      <Handle type="target" position={Position.Left} style={handleStyle} />
      <Handle type="source" position={Position.Right} style={handleStyle} />
      {data.label}
    </div>
  );
};

export const TextNode = ({ data, selected, dragging }: NodeProps<{ label: string; color?: string }>) => {
  const handleStyle: CSSProperties = { top: "50%", background: "#000" };
  return (
    <div
      style={{
        padding: "5px 10px",
        backgroundColor: "transparent",
        border: selected ? "2px solid #3b82f6" : "none",
        fontSize: "14px",
        cursor: dragging ? "grabbing" : "pointer",
        color: data.color || "#000",
        userSelect: "none",
        whiteSpace: "pre-wrap",
        position: "relative",
      }}
    >
      <Handle type="target" position={Position.Left} style={handleStyle} />
      <Handle type="source" position={Position.Right} style={handleStyle} />
      {data.label}
    </div>
  );
};

export const DiamondNode = ({ data, selected, dragging }: NodeProps<{ label: string; color?: string }>) => {
  const diamondStyle: CSSProperties = {
    width: "60px",
    height: "60px",
    transform: "rotate(45deg)",
    backgroundColor: data.color || "#fff",
    border: selected ? "3px solid #fff" : "2px solid #ccc",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: dragging ? "grabbing" : "pointer",
    userSelect: "none",
    color: "#000",
    position: "relative",
  };

  const labelStyle: CSSProperties = {
    transform: "rotate(-45deg)",
    fontSize: "12px",
    textAlign: "center",
  };

  const handleStyle: CSSProperties = { top: "50%" };

  return (
    <div style={diamondStyle}>
      <div style={labelStyle}>{data.label}</div>
      <Handle type="target" position={Position.Left} style={handleStyle} />
      <Handle type="source" position={Position.Right} style={handleStyle} />
    </div>
  );
};

const nodeTypes: NodeTypes = {
  circle: CircleNode,
  rect: RectNode,
  text: TextNode,
  diamond: DiamondNode,
};

const edgeTypes: EdgeTypes = {}; // default edges

// -----------------------------
// Mindmap Component (updated with props and initial data loading)
function MindmapContent({
  mindmapId,
  initialTitle = "",
  initialContentBody = "",
  initialCategoryId = "",
  initialTags = [],
  initialNodes = [{ id: "1", type: "circle", data: { label: "Central Node", color: "#fff" }, position: { x: 400, y: 100 }, draggable: true }],
  initialEdges = [],
}: MindmapContentProps) {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [newLabel, setNewLabel] = useState("New Node");
  const [selectedEdgeType, setSelectedEdgeType] = useState<"default" | "straight" | "step" | "smoothstep">("default");
  const reactFlowWrapperRef = useRef<HTMLDivElement>(null);
  const { fitView, getNode } = useReactFlow();
  const { token } = useAuth();
  const { createContent, updateContent } = useContent({ type: "mindmap" });

  // -----------------------------
  const { categories, loading: loadingCategories } = useCategories();
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>(initialCategoryId);
  // -----------------------------
const router = useRouter(); // ✅ Add this inside the component
  // -----------------------------
// Tags
// -----------------------------
const { tags: allTags = [] } = useTags();
const [tagQuery, setTagQuery] = useState("");
const [selectedTags, setSelectedTags] = useState<Tag[]>(initialTags);
const [searchResults, setSearchResults] = useState<Tag[]>([]);

// Fetch tags for editing (like post editor)
const { tags: fetchedTags, fetchTags } = useContentTags();
useEffect(() => {
  if (mindmapId) fetchTags(mindmapId);
}, [mindmapId]);

// Populate selected tags when fetched
useEffect(() => {
  if (fetchedTags.length > 0) {
    setSelectedTags(fetchedTags);
  }
}, [fetchedTags]);

// Handle input change (search/filter tags)
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

// Handle selecting a tag from dropdown
const handleAddTag = (tag: Tag) => {
  if (!selectedTags.some(t => t.id === tag.id)) {
    setSelectedTags(prev => [...prev, tag]);
  }
  setTagQuery("");
  setSearchResults([]);
};

// Handle removing a selected tag
const handleRemoveTag = (tagId: string) => {
  setSelectedTags(prev => prev.filter(t => t.id !== tagId));
};

// Prepare tag_ids for API
const tag_ids = selectedTags.map(tag => tag.id);

    

  // -----------------------------
  // Modal State
  // -----------------------------
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [title, setTitle] = useState(initialTitle);
  const [description, setDescription] = useState(initialContentBody);
  const [saving, setSaving] = useState(false);

  // -----------------------------
  // Node & Edge Handlers (unchanged)
  // -----------------------------
  const addNode = useCallback((type: "circle" | "rect" | "diamond" = "circle") => {
    const id = (nodes.length + 1).toString();
    let position = { x: Math.random() * 200 + 100, y: Math.random() * 200 + 100 };
    if (selectedNodeId) {
      const selectedNode = getNode(selectedNodeId);
      if (selectedNode) {
        const offset = { x: Math.random() * 100 - 50, y: Math.random() * 100 - 50 };
        position = { x: selectedNode.position.x + offset.x + 100, y: selectedNode.position.y + offset.y + 50 };
      }
    }
    const newNode: Node = { id, type, data: { label: newLabel, color: "#fff" }, position, draggable: true };
    setNodes((nds) => nds.concat(newNode));
    if (selectedNodeId) {
      const edgeType = selectedEdgeType === "default" ? undefined : selectedEdgeType; // ✅ FIXED: Added "undefined"
      setEdges((eds) => addEdge({ id: `e${selectedNodeId}-${id}`, source: selectedNodeId, target: id, type: edgeType }, eds));
    }
    setNewLabel("New Node");
    fitView({ padding: 0.2 });
  }, [nodes.length, selectedNodeId, getNode, setNodes, setEdges, newLabel, fitView, selectedEdgeType]);

  const addTextNode = useCallback(() => {
    const id = `text-${nodes.length + 1}`;
    const position = { x: Math.random() * 400 + 200, y: Math.random() * 300 + 150 };
    const newNode: Node = { id, type: "text", data: { label: newLabel || "New Text", color: "#fff" }, position, draggable: true };
    setNodes((nds) => nds.concat(newNode));
    setNewLabel("New Node");
    fitView({ padding: 0.2 });
  }, [nodes.length, selectedNodeId, getNode, setNodes, setEdges, newLabel, selectedEdgeType, fitView]);

  const onConnect = useCallback((connection: Connection) => {
    const edgeType = selectedEdgeType === "default" ? undefined : selectedEdgeType;
    setEdges((eds) => addEdge({ ...connection, type: edgeType }, eds));
  }, [setEdges, selectedEdgeType]);

  const changeColor = useCallback((color: string) => {
    if (!selectedNodeId) return;
    setNodes((nds) => nds.map((n) => (n.id === selectedNodeId ? { ...n, data: { ...n.data, color } } : n)));
  }, [selectedNodeId, setNodes]);

  const renameNode = useCallback(() => {
    if (!selectedNodeId) return;
    const label = prompt("Enter new label:");
    if (label) setNodes((nds) => nds.map((n) => (n.id === selectedNodeId ? { ...n, data: { ...n.data, label } } : n)));
  }, [selectedNodeId, setNodes]);

  const deleteNode = useCallback(() => {
    if (!selectedNodeId) return;
    setNodes((nds) => nds.filter((n) => n.id !== selectedNodeId));
    setEdges((eds) => eds.filter((e) => e.source !== selectedNodeId && e.target !== selectedNodeId));
    setSelectedNodeId(null);
  }, [selectedNodeId, setNodes, setEdges]);

  // -----------------------------
// Save Mindmap (Updated for edit/create)
// -----------------------------
const handleSave = useCallback(async () => {
  if (!title) return alert("Please enter a title!");
  if (!selectedCategoryId) return alert("Please select a category!");
  if (!token) return alert("❌ You must be logged in to save!");

  setSaving(true);

  try {
    const mindmapData = {
      nodes: nodes.map(n => ({ ...n, data: { ...n.data }, position: { ...n.position }, type: n.type })),
      edges: edges.map(e => ({ ...e, type: e.type, animated: e.animated })),
    };

    const dataToSend = {
      title,
      content_body: description,
      excalidraw_data: mindmapData,
      category_id: selectedCategoryId,
      tag_ids,
      status: CONTENT_STATUS.PUBLISHED,
    };

    if (mindmapId) {
      await updateContent(mindmapId, dataToSend, token); // Edit
      
    } else {
      await createContent(dataToSend, token); // Create
     
    }

    // ✅ Redirect to published mindmaps page
    router.push("/dashboard/mindmaps");
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    alert(`Error: ${message}`);
  } finally {
    setSaving(false);
  }
}, [title, description, selectedCategoryId, nodes, edges, token, createContent, updateContent, tag_ids, mindmapId, router]);

// -----------------------------
// Draft Mindmap (Updated for edit/create)
// -----------------------------
const handleDraft = useCallback(async () => {
  if (!title) return alert("Please enter a title!");
  if (!selectedCategoryId) return alert("Please select a category!");
  if (!token) return alert("❌ You must be logged in to save as draft!");

  setSaving(true);

  try {
    const mindmapData = {
      nodes: nodes.map(n => ({ ...n, data: { ...n.data }, position: { ...n.position }, type: n.type })),
      edges: edges.map(e => ({ ...e, type: e.type, animated: e.animated })),
    };

    const dataToSend = {
      title,
      content_body: description,
      excalidraw_data: mindmapData,
      category_id: selectedCategoryId,
      tag_ids,
      status: CONTENT_STATUS.DRAFT,
    };

    if (mindmapId) {
      await updateContent(mindmapId, dataToSend, token); // Edit
      
    } else {
      await createContent(dataToSend, token); // Create
      
    }

    // ✅ Redirect to drafts page
    router.push("/dashboard/mindmaps/drafts");
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    alert(`Error: ${message}`);
  } finally {
    setSaving(false);
  }
}, [title, description, selectedCategoryId, nodes, edges, token, createContent, updateContent, tag_ids, mindmapId, router]);


  // -----------------------------
  // Export PNG (unchanged)
  // -----------------------------
  const exportPng = useCallback(async () => {
    if (reactFlowWrapperRef.current) {
      const canvas = await html2canvas(reactFlowWrapperRef.current, {
        backgroundColor: "rgba(255,255,255,0.03)",
        useCORS: true,
      });
      const link = document.createElement("a");
      link.href = canvas.toDataURL("image/png");
      link.download = "mindmap.png";
      link.click();
    }
  }, []);

  const selectedNode = nodes.find((n) => n.id === selectedNodeId);
  const nodeInfo = selectedNode ? (
    <div style={{
      padding: "10px",
      background: "rgba(255, 255, 255, 0.03)",
      borderRadius: "4px",
      fontSize: "12px",
    }}>
      <strong>Selected: {selectedNode.data.label}</strong>
      <br />
      Type: {selectedNode.type}
      <br />
      Position: {Math.round(selectedNode.position.x)}, {Math.round(selectedNode.position.y)}
      <br />
      Color: <span style={{
        background: selectedNode.data.color,
        width: "20px",
        height: "10px",
        display: "inline-block",
        borderRadius: "2px",
      }}></span>
      <br />
      Edge Type: {selectedEdgeType}
    </div>
  ) : (
    <div>No node selected</div>
  );

  return (

    <div ref={reactFlowWrapperRef} style={{ display: "flex", flexDirection: "column", height: "100vh" }}>
      {/* Toolbar (unchanged) */}
      <div style={{ padding: "10px", background: "rgba(255,255,255,0.03)", borderRadius: "12px", display: "flex", gap: "8px", flexWrap:      "wrap" }}>
        <input type="text" value={newLabel} onChange={(e) => setNewLabel(e.target.value)} placeholder="Node label" style={{ padding: "5px", borderRadius: "4px", border: "1px solid rgba(255,255,255,0.08)" }} />
        <button onClick={() => addNode("circle")}><Circle size={16} /></button>
        <button onClick={() => addNode("rect")}><Square size={16} /></button>
        <button onClick={() => addNode("diamond")}><Diamond size={16} /></button>
        <button onClick={addTextNode}><Plus size={16} /></button>
        <button onClick={() => changeColor("#22c55e")}>🟩</button>
        <button onClick={() => changeColor("#3b82f6")}>🟦</button>
        <button onClick={() => changeColor("#facc15")}>🟨</button>
        <button onClick={() => changeColor("#f43f5e")}>🟥</button>
        <button onClick={renameNode}><Edit size={16} /></button>
        <button onClick={deleteNode}><Trash2 size={16} /></button>
        <button onClick={() => setIsModalOpen(true)}><Save size={16} /></button>
        <button onClick={exportPng}><Camera size={16} /></button>
        <label>Line Type:</label>
        {(["default","straight","step","smoothstep"] as const).map((type) => (
          <label key={type}>
            <input
              type="radio"
              checked={selectedEdgeType === type}
              onChange={() => setSelectedEdgeType(type)}
            />{" "}
            {type}
          </label>
        ))}
      </div>

      {/* React Flow */}
      <div style={{ flex: 1, position: "relative" }}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          onNodeClick={(_, node) => setSelectedNodeId(node.id)}
          fitView
        >
          <MiniMap nodeColor={(n) => n.data.color || "#101211ff"} />
          <Controls />
          <Background color="#444" gap={12} size={1} />
          <Panel position="top-right" style={{ padding: "10px" }}>
            {nodeInfo}
          </Panel>
        </ReactFlow>
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
          }}
        >
          <div
            className="relative custom-scrollbar isolate bg-white/[0.05] border border-[rgba(80,80,80,0.24)] shadow-[inset_0px_0px_7px_rgba(255,255,255,0.16)] backdrop-blur-[37px] rounded-[16px] overflow-y-auto"
            style={{
              padding: "20px",
              borderRadius: "8px",
              width: "711px",
              height: "565px",
              display: "flex",
              flexDirection: "column",
              gap: "16px",
            }}
          >
            {/* Header with title + close button */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: "10px",
              }}
            >
              <h1 style={{ margin: 0, fontSize: "18px", textAlign: "left" }}>Mind Map Create</h1>
              <button
                onClick={() => setIsModalOpen(false)}
                className="w-[24px] h-[24px] flex items-center justify-center rounded-full bg-white text-black font-bold text-sm hover:bg-gray-200 transition"
              >
                ×
              </button>
            </div>

            {/* Title label + input */}
            <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", width: "100%", gap: "6px" }}>
              <label style={{ fontSize: "16px", fontWeight: 500, textAlign: "left" }}>Title</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter title"
                style={{
                  padding: "8px",
                  borderRadius: "6px",
                  width: "663px",
                  border: "1px solid rgba(255,255,255,0.1)",
                  color: "white",
                }}
              />
            </div>

            {/* Category label + selector */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "flex-start",
                width: "100%",
                gap: "6px",
              }}
            >
              <label
                style={{
                  fontSize: "16px",
                  fontWeight: 500,
                  textAlign: "left",
                }}
              >
                Category
              </label>
              <div
                style={{
                  position: "relative",
                  width: "663px",
                }}
              >
                <select
                  value={selectedCategoryId}
                  onChange={(e) => setSelectedCategoryId(e.target.value)}
                  style={{
                    appearance: "none",
                    WebkitAppearance: "none",
                    MozAppearance: "none",
                    padding: "8px",
                    borderRadius: "6px",
                    width: "100%",
                    backgroundColor: "",
                    border: "1px solid rgba(255,255,255,0.1)",
                    color: "white",
                    cursor: "pointer",
                  }}
                >
                  <option
                    value=""
                    style={{ backgroundColor: "rgba(0,0,0,0.8)", color: "white" }}
                  >
                    {loadingCategories ? "Loading categories..." : "Select a category"}
                  </option>
                  {categories.map((cat) => (
                    <option
                      key={cat.id}
                      value={cat.id}
                      style={{ backgroundColor: "rgba(0,0,0,0.8)", color: "white" }}
                    >
                      {cat.name}
                    </option>
                  ))}
                </select>
                {/* Custom arrow */}
                <div
                  style={{
                    position: "absolute",
                    top: "50%",
                    right: "10px",
                    pointerEvents: "none",
                    transform: "translateY(-50%)",
                    width: 0,
                    height: 0,
                    borderLeft: "6px solid transparent",
                    borderRight: "6px solid transparent",
                    borderTop: "6px solid gray",
                  }}
                />
              </div>
            </div>

            {/* Tags label + input */}
            <div style={{ display: "flex", flexDirection: "column", gap: "6px", width: "100%" }}>
              <label style={{ fontSize: "16px", fontWeight: 500 }}>Tags</label>

              {/* Unified tag input container (pills + input in same box) */}
              <div style={{ 
                position: "relative", 
                width: "663px",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: "6px",
                background: "",
                padding: "8px",
                minHeight: "44px",
                display: "flex",
                flexDirection: "column",
              }}>
                {/* Pills + Input Row (flex wrap for multi-line if many pills) */}
                <div style={{ 
                  display: "flex", 
                  flexWrap: "wrap", 
                  gap: "4px", 
                  alignItems: "center",
                  flex: 1,
                }}>
                  {/* Selected tags as pills (inline with input) */}
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
                      >
                        ×
                      </span>
                    </div>
                  ))}

                  {/* Input field (takes remaining space, shrinks if needed) */}
                  <input
                    type="text"
                    value={tagQuery}
                    onChange={handleTagInputChange}
                    placeholder={selectedTags.length > 0 ? "" : "Search tags..."}
                    style={{
                      flex: 1,
                      minWidth: "120px",
                      border: "none",
                      outline: "none",
                      background: "transparent",
                      color: "white",
                      fontSize: "14px",
                      padding: "4px 0",
                      margin: "0 4px 4px 0",
                    }}
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

                {/* Dropdown (positioned below the entire container) */}
                {tagQuery && searchResults.length > 0 && (
                  <div
                    style={{
                      position: "absolute",
                      top: "100%",
                      left: 0,
                      right: 0,
                      background: "rgba(0,0,0,0.8)",
                      color: "white",
                      maxHeight: "150px",
                      overflowY: "auto",
                      borderRadius: "6px",
                      zIndex: 1000,
                      border: "1px solid rgba(255,255,255,0.1)",
                      marginTop: "4px",
                    }}
                  >
                    {searchResults.map(tag => (
                      <div
                        key={tag.id}
                        style={{ 
                          padding: "8px 12px", 
                          cursor: "pointer",
                          borderBottom: "1px solid rgba(255,255,255,0.05)",
                        }}
                        onClick={() => handleAddTag(tag)}
                      >
                        {tag.name}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Description label + textarea */}
            <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", width: "100%", gap: "6px" }}>
              <label style={{ fontSize: "16px", fontWeight: "500", textAlign: "left" }}>Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Enter description"
                rows={4}
                style={{
                  padding: "8px",
                  borderRadius: "6px",
                  height: "100px",
                  width: "663px",
                  border: "1px solid rgba(255,255,255,0.1)",
                  color: "white",
                  resize: "none",
                }}
              />
            </div>

            {/* Buttons */}
            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                width: "100%",
                marginTop: "16px",
                gap: "10px",
              }}
            >
              <button
                onClick={() => setIsModalOpen(false)}
                className="relative w-[78px] h-[36px] rounded-full bg-white/[0.05] border border-white/10 shadow-[inset_0_0_4px_rgba(239,214,255,0.25)] backdrop-blur-[10px] text-white font-bold text-xs flex items-center justify-center transition hover:scale-[1.02] overflow-hidden"
              >
                <span className="absolute inset-0 rounded-full bg-[radial-gradient(circle,rgba(90, 0, 0, 0.5)_0%,transparent_70%)] blur-md" />
                <span className="relative z-10">{"Cancel"}</span>
              </button>

              <button
                onClick={handleDraft}
                disabled={saving}
                className="relative w-[78px] h-[36px] rounded-full bg-white/[0.05] border border-white/10 shadow-[inset_0_0_4px_rgba(239,214,255,0.25)] backdrop-blur-[10px] text-white font-bold text-xs flex items-center justify-center transition hover:scale-[1.02] overflow-hidden"
              >
                <span className="absolute inset-0 rounded-full bg-[radial-gradient(circle,rgba(90, 0, 0, 0.5)_0%,transparent_70%)] blur-md" />
                <span className="relative z-10">{"Draft"}</span>
              </button>

              <button
                onClick={handleSave}
                disabled={saving}
                className="relative w-[78px] h-[36px] rounded-full bg-white/[0.05] border border-white/10 shadow-[inset_0_0_4px_rgba(239,214,255,0.25)] backdrop-blur-[10px] flex items-center justify-center transition hover:scale-[1.02] overflow-hidden"
                style={{
                  fontFamily: "Public Sans, sans-serif",
                  fontStyle: "normal",
                  fontWeight: 700,
                  fontSize: "14px",
                  lineHeight: "24px",
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
    </div>
  );
}

// -----------------------------
// Main Page
// -----------------------------
// -----------------------------
// Export the component with props
// -----------------------------
export default MindmapContent;