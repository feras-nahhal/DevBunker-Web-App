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
import { useContent } from "@/hooks/useContent";
import { useCategories } from "@/hooks/useCategories";
import { useContentTags } from "@/hooks/useContentTags";
import { useTags } from "@/hooks/useTags";
import { Edge, NodeProps, NodeResizer } from "reactflow";
import { useRouter } from "next/navigation"; // ✅ Add this import
import { Position } from "reactflow";
import ReactFlow, {
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
import { useAuthContext } from "@/hooks/AuthProvider";

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
    isModalOpen?: boolean; // New: External control for modal
  setIsModalOpen?: (open: boolean) => void; // New: External setter for modal
}

interface NodeCustomData {
  editingNodeId: string | null;
  editingLabel: string;
  setEditingNodeId: (id: string | null) => void;
  setEditingLabel: (label: string) => void;
  setNodes: React.Dispatch<React.SetStateAction<Node[]>>;
}



// -----------------------------
// Node Components (unchanged)
export const CircleNode = ({
  data,
  selected,
  dragging,
  id,
}: NodeProps<{ label: string; color?: string; custom?: NodeCustomData }>) => {
  const handleStyle: CSSProperties = { top: "50%" };

  const {
    editingNodeId = null,
    editingLabel = "",
    setEditingNodeId = () => {},
    setEditingLabel = () => {},
    setNodes = () => {},
  } = data.custom || {};

  const handleDoubleClick = () => {
    setEditingNodeId(id);
    setEditingLabel(data.label);
  };

  const handleBlur = () => {
    setNodes((nds: Node[]) =>
      nds.map((n) =>
        n.id === id ? { ...n, data: { ...n.data, label: editingLabel } } : n
      )
    );
    setEditingNodeId(null);
  };

  return (
    <div
      onDoubleClick={handleDoubleClick}
      style={{
        padding: "10px 20px",
        backgroundColor: data.color || "#fff",
        border: selected ? "3px solid #fff" : "2px solid #ccc",
        borderRadius: "50%",
        textAlign: "center",
        cursor: dragging ? "grabbing" : "pointer",
        color: "#000",
        userSelect: "none",
        position: "relative",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        minWidth: "50px",
        minHeight: "50px",
      }}
    >
      <Handle type="target" position={Position.Left} style={handleStyle} />
      <Handle type="source" position={Position.Right} style={handleStyle} />

      {editingNodeId === id ? (
        <input
          autoFocus
          value={editingLabel}
          onChange={(e) => setEditingLabel(e.target.value)}
          onBlur={handleBlur}
          onKeyDown={(e) => e.key === "Enter" && handleBlur()}
          style={{
            fontSize: "14px",
            width: "100%",           // Fill the node width
            height: "100%",          // Fill the node height
            textAlign: "center",
            border: "none",          // Remove border
            outline: "none",         // Remove focus outline
            background: "transparent", // Transparent background
            color: "#000",
            borderRadius: "50%",
          }}
        />
      ) : (
        data.label
      )}

      {selected && (
        <NodeResizer
          color="rgba(34,197,94,0.15)"
          isVisible={selected}
          minWidth={50}
          minHeight={50}
          handleStyle={{
            width: 10,
            height: 10,
            border: "2px solid rgba(34,197,94,0.15)",
            background: "rgba(34,197,94,0.15)",
            borderRadius: "50%",
          }}
        />
      )}
    </div>
  );
};




export const RectNode = ({
  data,
  selected,
  dragging,
  id,
}: NodeProps<{ label: string; color?: string; custom?: NodeCustomData }>) => {
  const handleStyle: CSSProperties = { top: "50%" };

  const {
    editingNodeId = null,
    editingLabel = "",
    setEditingNodeId = () => {},
    setEditingLabel = () => {},
    setNodes = () => {},
  } = data.custom || {};

  const handleDoubleClick = () => {
    setEditingNodeId(id);
    setEditingLabel(data.label);
  };

  const handleBlur = () => {
    setNodes((nds: Node[]) =>
      nds.map((n) =>
        n.id === id ? { ...n, data: { ...n.data, label: editingLabel } } : n
      )
    );
    setEditingNodeId(null);
  };

  return (
    <div
      onDoubleClick={handleDoubleClick}
      style={{
        padding: "10px 20px",
        backgroundColor: data.color || "#fff",
        border: selected ? "3px solid #fff" : "2px solid #ccc",
        borderRadius: "6px",
        textAlign: "center",
        cursor: dragging ? "grabbing" : "pointer",
        color: "#000",
        userSelect: "none",
        position: "relative",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        minWidth: "50px",
        minHeight: "50px",
      }}
    >
      <Handle type="target" position={Position.Left} style={handleStyle} />
      <Handle type="source" position={Position.Right} style={handleStyle} />

      {editingNodeId === id ? (
        <input
          autoFocus
          value={editingLabel}
          onChange={(e) => setEditingLabel(e.target.value)}
          onBlur={handleBlur}
          onKeyDown={(e) => e.key === "Enter" && handleBlur()}
          style={{
            fontSize: "14px",
            width: "100%",           // Fill the node width
            height: "100%",          // Fill the node height
            textAlign: "center",
            border: "none",          // Remove border
            outline: "none",         // Remove focus outline
            background: "transparent", // Transparent background
            color: "#000",
            borderRadius: "6px",
          }}
        />
      ) : (
        data.label
      )}

      {selected && (
        <NodeResizer
          color="rgba(34,197,94,0.15)"
          isVisible={selected}
          minWidth={50}
          minHeight={50}
          handleStyle={{
            width: 10,
            height: 10,
            border: "2px solid rgba(34,197,94,0.15)",
            background: "rgba(34,197,94,0.15)",
            borderRadius: "50%",
          }}
        />
      )}
    </div>
  );
};



export const TextNode = ({
  data,
  selected,
  dragging,
  id,
}: NodeProps<{ label: string; color?: string; custom?: NodeCustomData }>) => {
  const handleStyle: CSSProperties = { top: "50%", background: "#000" };

  const {
    editingNodeId = null,
    editingLabel = "",
    setEditingNodeId = () => {},
    setEditingLabel = () => {},
    setNodes = () => {},
  } = data.custom || {};

  const handleDoubleClick = () => {
    setEditingNodeId(id);
    setEditingLabel(data.label);
  };

  const handleBlur = () => {
    setNodes((nds: Node[]) =>
      nds.map((n) =>
        n.id === id ? { ...n, data: { ...n.data, label: editingLabel } } : n
      )
    );
    setEditingNodeId(null);
  };

  return (
    <div
      onDoubleClick={handleDoubleClick}
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
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        minWidth: "50px",
        minHeight: "30px",
      }}
    >
      <Handle type="target" position={Position.Left} style={handleStyle} />
      <Handle type="source" position={Position.Right} style={handleStyle} />

      {editingNodeId === id ? (
        <input
          autoFocus
          value={editingLabel}
          onChange={(e) => setEditingLabel(e.target.value)}
          onBlur={handleBlur}
          onKeyDown={(e) => e.key === "Enter" && handleBlur()}
          style={{
            fontSize: "14px",
            width: "100%",
            height: "100%",
            textAlign: "center",
            border: "none",
            outline: "none",
            background: "transparent",
            color: data.color || "#000",
          }}
        />
      ) : (
        data.label
      )}

      {selected && (
        <NodeResizer
          color="rgba(34,197,94,0.15)"
          isVisible={selected}
          minWidth={50}
          minHeight={20}
          handleStyle={{
            width: 10,
            height: 10,
            border: "2px solid rgba(34,197,94,0.15)",
            background: "rgba(34,197,94,0.15)",
            borderRadius: "50%",
          }}
        />
      )}
    </div>
  );
};

export const DiamondNode = ({
  data,
  selected,
  dragging,
  id,
}: NodeProps<{ label: string; color?: string; custom?: NodeCustomData }>) => {
  const {
    editingNodeId = null,
    editingLabel = "",
    setEditingNodeId = () => {},
    setEditingLabel = () => {},
    setNodes = () => {},
  } = data.custom || {};

  const handleDoubleClick = () => {
    setEditingNodeId(id);
    setEditingLabel(data.label);
  };

  const handleBlur = () => {
    setNodes((nds: Node[]) =>
      nds.map((n) =>
        n.id === id ? { ...n, data: { ...n.data, label: editingLabel } } : n
      )
    );
    setEditingNodeId(null);
  };

  const diamondStyle: CSSProperties = {
    backgroundColor: data.color || "#fff",
    border: selected ? "3px solid #fff" : "2px solid #ccc",
    clipPath: "polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: dragging ? "grabbing" : "pointer",
    userSelect: "none",
    color: "#000",
    position: "relative",
    minWidth: 60,
    minHeight: 60,
    padding: 10,
    textAlign: "center",
  };

  const handleStyle: CSSProperties = {
    top: "50%",
    transform: "translateY(-50%)",
  };

  return (
    <div onDoubleClick={handleDoubleClick} style={diamondStyle}>
      {editingNodeId === id ? (
        <input
          autoFocus
          value={editingLabel}
          onChange={(e) => setEditingLabel(e.target.value)}
          onBlur={handleBlur}
          onKeyDown={(e) => e.key === "Enter" && handleBlur()}
          style={{
            width: "100%",
            height: "100%",
            textAlign: "center",
            border: "none",
            outline: "none",
            background: "transparent",
            color: "#000",
            fontSize: 12,
          }}
        />
      ) : (
        <div style={{ fontSize: 12 }}>{data.label}</div>
      )}

      <Handle type="target" position={Position.Left} style={handleStyle} />
      <Handle type="source" position={Position.Right} style={handleStyle} />

      {selected && (
        <NodeResizer
          color="rgba(34,197,94,0.15)"
          isVisible={selected}
          minWidth={50}
          minHeight={50}
          handleStyle={{
            width: 10,
            height: 10,
            border: "2px solid rgba(34,197,94,0.15)",
            background: "rgba(34,197,94,0.15)",
            borderRadius: "50%",
          }}
        />
      )}
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
  isModalOpen: externalIsModalOpen, // New: Use external if provided
  setIsModalOpen: externalSetIsModalOpen,
}: MindmapContentProps) {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [newLabel, setNewLabel] = useState("New Node");
  const [selectedEdgeType, setSelectedEdgeType] = useState<"default" | "straight" | "step" | "smoothstep">("default");
  const reactFlowWrapperRef = useRef<HTMLDivElement>(null);
  const { fitView, getNode } = useReactFlow();
  const { token} = useAuthContext();
  const { createContent, updateContent } = useContent({ type: "mindmap" });
//----------------------------------------------------------------------------------//
  const [editingNodeId, setEditingNodeId] = useState<string | null>(null);
  const [editingLabel, setEditingLabel] = useState<string>("");
// Wrap nodes to include custom editing state
const nodesWithCustom: Node[] = nodes.map(n => ({
  ...n,
  data: {
    ...n.data,
    custom: {
      editingNodeId,
      editingLabel,
      setEditingNodeId,
      setEditingLabel,
      setNodes
    }
  }
}));



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
const [dropdownOpen, setDropdownOpen] = useState(false);
    

  // -----------------------------
  // Modal State
  // -----------------------------
  // -----------------------------
  // Modal State (now conditional based on props)
  // -----------------------------
  const [internalIsModalOpen, setInternalIsModalOpen] = useState(false);
  const isModalOpen = externalIsModalOpen !== undefined ? externalIsModalOpen : internalIsModalOpen;
  const setIsModalOpen = externalSetIsModalOpen || setInternalIsModalOpen;

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
        nodes={nodesWithCustom}  // <-- use this
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
      padding: "16px", // Add padding for mobile edges
    }}
  >
    <div
      className="relative custom-scrollbar isolate bg-white/[0.05] border border-[rgba(80,80,80,0.24)] shadow-[inset_0px_0px_7px_rgba(255,255,255,0.16)] backdrop-blur-[37px] rounded-[16px] overflow-y-auto w-full max-w-[711px] min-h-[400px] max-h-[90vh]" // Responsive: full width on mobile, max 711px on larger; auto height with max 90vh
      style={{
        padding: "20px", // Reduced on mobile via Tailwind
        display: "flex",
        flexDirection: "column",
        gap: "16px",
      }}
    >
      {/* Header with title + close button */}
      <div
        className="flex items-center justify-between mb-2 sm:mb-4" // Responsive margin
      >
        <h1 className="m-0 text-lg sm:text-xl text-left">Mind Map Create</h1> {/* Responsive font size */}
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
          className="w-full p-2 sm:p-3 border border-white/10 rounded-md bg-transparent text-white text-sm sm:text-base" // Full width, responsive padding
        />
      </div>

      {/* Category Select */}
      <div className="relative w-full flex flex-col items-start gap-2">
        <label className="text-sm sm:text-base font-medium text-left text-white">Category</label>

        {/* Dropdown header */}
        <div
          onClick={() => setDropdownOpen(!dropdownOpen)}
          className="flex justify-between items-center p-2 sm:p-3 bg-white/10 border border-white/20 rounded-lg text-white text-sm cursor-pointer transition hover:bg-white/20 w-full" // Full width
        >
          {selectedCategoryId
            ? categories.find((cat) => cat.id === selectedCategoryId)?.name
            : loadingCategories
            ? "Loading categories..."
            : "Select a category"}
          <span className="ml-2 text-xs opacity-70">▼</span>
        </div>

        {/* Dropdown menu */}
        {dropdownOpen && (
          <div
            className="absolute top-full left-0 w-full mt-1 bg-black/80 border border-white/20 rounded-lg backdrop-blur-2xl shadow-[0_0_15px_rgba(0,0,0,0.4)] z-50 max-h-48 overflow-y-scroll" // Full width
            style={{
              scrollbarWidth: "none", // Firefox
              msOverflowStyle: "none", // IE/Edge
            }}
          >
            {/* Hide scrollbar for Chrome, Safari, Edge */}
            <style>
              {`
                div::-webkit-scrollbar {
                  display: none;
                }
              `}
            </style>

            {/* Default option */}
            <div
              onClick={() => {
                setSelectedCategoryId("");
                setDropdownOpen(false);
              }}
              className="p-2 text-white text-sm hover:bg-white/20 cursor-pointer"
            >
              Select a category
            </div>

            {/* Category list */}
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

      {/* Tags label + input */}
      <div style={{ display: "flex", flexDirection: "column", gap: "6px", width: "100%" }}>
          <label style={{ fontSize: "16px", fontWeight: 500 }}>Tags</label>

        {/* Unified tag input container (pills + input in same box) */}
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
          }}> {/* Full width, responsive padding */}
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
                    className="w-[15px] h-[15px] flex items-center justify-center rounded-full bg-white text-black font-bold text-sm hover:bg-gray-200 transition"
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
              className="flex-1 min-w-[100px] sm:min-w-[120px] border-none outline-none bg-transparent text-white text-sm sm:text-base p-1 sm:p-2" // Responsive
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
              className="absolute top-full left-0 right-0 bg-black/80 text-white max-h-32 sm:max-h-40 overflow-y-auto rounded-md z-1000 border border-white/10 mt-1" // Responsive height
            >
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

      {/* Description label + textarea */}
      <div className="flex flex-col items-start w-full gap-2">
        <label className="text-sm sm:text-base font-medium text-left">Description</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Enter description"
          rows={3} // Reduced rows for mobile
          className="w-full p-2 sm:p-3 border border-white/10 rounded-md bg-transparent text-white text-sm sm:text-base resize-none min-h-[80px] sm:min-h-[100px]" // Full width, responsive
        />
      </div>

      {/* Buttons */}
      <div className="flex justify-end w-full mt-4 gap-2 sm:gap-3"> {/* Responsive gap */}
        <button
          onClick={() => setIsModalOpen(false)}
          className="relative w-16 sm:w-20 h-8 sm:h-9 rounded-full bg-white/[0.05] border border-white/10 shadow-[inset_0_0_4px_rgba(239,214,255,0.25)] backdrop-blur-[10px] text-white font-bold text-xs sm:text-sm flex items-center justify-center transition hover:scale-105 overflow-hidden" // Larger on mobile
        >
          <span className="absolute inset-0 rounded-full bg-[radial-gradient(circle,rgba(90, 0, 0, 0.5)_0%,transparent_70%)] blur-md" />
          <span className="relative z-10">Cancel</span>
        </button>

        <button
          onClick={handleDraft}
          disabled={saving}
          className="relative w-16 sm:w-20 h-8 sm:h-9 rounded-full bg-white/[0.05] border border-white/10 shadow-[inset_0_0_4px_rgba(239,214,255,0.25)] backdrop-blur-[10px] text-white font-bold text-xs sm:text-sm flex items-center justify-center transition hover:scale-105 overflow-hidden disabled:opacity-50" // Larger on mobile
        >
          <span className="absolute inset-0 rounded-full bg-[radial-gradient(circle,rgba(90, 0, 0, 0.5)_0%,transparent_70%)] blur-md" />
          <span className="relative z-10">Draft</span>
        </button>

        <button
          onClick={handleSave}
          disabled={saving}
          className="relative w-16 sm:w-20 h-8 sm:h-9 rounded-full bg-white/[0.05] border border-white/10 shadow-[inset_0_0_4px_rgba(239,214,255,0.25)] backdrop-blur-[10px] flex items-center justify-center transition hover:scale-105 overflow-hidden disabled:opacity-50" // Larger on mobile
          style={{
            fontFamily: "Public Sans, sans-serif",
            fontStyle: "normal",
            fontWeight: 700,
            fontSize: "12px", // Responsive via class
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

    </div>
  );
}

// -----------------------------
// Main Page
// -----------------------------

export default MindmapContent;