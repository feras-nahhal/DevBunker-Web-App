"use client";

import { Node, Edge } from "reactflow"; // You can remove this if no longer using React Flow
import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

import Sidebar from "@/components/layout/Sidebar";
// ✅ Updated: Import the Excalidraw-based component
import CreateMinemapHeader from "@/components/layout/CreateMinemapHeader";
import MindmapEditorSkeleton from "@/components/content/MindmapEditorSkeleton";

import { useContent, ContentType } from "@/hooks/useContent";
import { useAuthContext } from "@/hooks/AuthProvider";
import { AnyContent } from "@/types/content";
import { CONTENT_STATUS } from "@/lib/enums";
import "./PostPage.css";
import MindmapContent from "@/components/content/MindmapContent";
import type { 
  ExcalidrawElement 
} from "@excalidraw/excalidraw/element/types";
import type { AppState } from "@excalidraw/excalidraw/types";
import type { BinaryFileData } from "@excalidraw/excalidraw/types";


interface Tag {
  id: string;
  name: string;
}

// ✅ Updated: Change to match Excalidraw's data structure
interface ExcalidrawData {
  elements: ExcalidrawElement[]; // ✅ Array of Excalidraw elements
  appState: AppState;            // ✅ Excalidraw app state
  files?: Record<string, BinaryFileData>; // Optional files
}


export default function PostPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const router = useRouter();
  const { user, loading: authLoading, isAuthenticated } = useAuthContext(); // ✅ Updated
  const [mindmapId, setMindmapId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [contentBody, setContentBody] = useState("");
  const [saving, setSaving] = useState(false);
  const [selectedTags, setSelectedTags] = useState<Tag[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false); // NEW: Separate state for mobile sidebar
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [ready, setReady] = useState(false);
  // ✅ Removed: nodes and edges state (no longer needed)
  // const [nodes, setNodes] = useState<Node[]>([]);
  // const [edges, setEdges] = useState<Edge[]>([]);
  // ✅ Added: State for Excalidraw data
const [excalidrawData, setExcalidrawData] = useState<ExcalidrawData>({
  elements: [],
  appState: {} as AppState,
  files: {}
});



  const { getContentById, createContent, updateContent, loading: contentLoading, refetch } =
    useContent({ type: "mindmap" as ContentType, autoFetch: false });

  // ✅ Get query param
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      setMindmapId(params.get("id"));
    }
  }, []);

  // ✅ Wait until auth state is ready
  useEffect(() => {
    if (!authLoading && isAuthenticated) setReady(true);
  }, [authLoading, isAuthenticated]);

  // ✅ Fetch mindmap data if editing
useEffect(() => {
  if (!mindmapId || !ready) return;

  const fetchMindmap = async () => {
    try {
      const data = await getContentById(mindmapId);
      if (data) {
        setTitle(data.title || "");
        setContentBody(data.content_body || "");
        setSelectedCategoryId(data.category_id || null);
        setSelectedTags(data.tags || []);
        // ✅ Clone and normalize excalidraw_data here to ensure mutability
        const excalidrawData = data.excalidraw_data ? (() => {
          const cloned = JSON.parse(JSON.stringify(data.excalidraw_data));
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
        })() : { elements: [], appState: {}, files: {} };
        setExcalidrawData(excalidrawData);
      }
    } catch (err) {
      alert(`Error fetching mindmap: ${err instanceof Error ? err.message : "Unknown error"}`);
    }
  };

  fetchMindmap();
}, [mindmapId, ready, getContentById]);


  const isLoading = authLoading || contentLoading || saving;

  const handleCancel = () => {
    setTitle("");
    setContentBody("");
    setSelectedTags([]);
    setSelectedCategoryId(null);
    // ✅ Updated: Reset Excalidraw data
    setExcalidrawData({   elements: [],
  appState: {} as AppState,
  files: {}});
    router.push("/dashboard/mindmaps");
  };

  // ✅ Updated: Use Excalidraw data for initial props
  const initialTags = useMemo(() => selectedTags, [selectedTags]);
  const initialCategoryId = useMemo(() => selectedCategoryId || "", [selectedCategoryId]);
  const initialExcalidrawData = useMemo(() => excalidrawData, [excalidrawData]);

  if (!ready || contentLoading) {
    return (
      <div className="dashboard">
        <Sidebar 
          onToggle={(collapsed) => setSidebarCollapsed(collapsed)} 
          isMobileOpen={isMobileSidebarOpen}  // NEW: Pass mobile props
          onMobileToggle={setIsMobileSidebarOpen}  // NEW: Pass mobile props
        />
        <div className={`main-content ${sidebarCollapsed ? "collapsed" : ""}`}>
          <CreateMinemapHeader
            onSave={() => setIsModalOpen(true)} // ✅ Changed: Now triggers the modal instead of direct save
            onCancel={handleCancel} // ✅ Unchanged: Still redirects
            saving={isLoading}
            collapsed={sidebarCollapsed}
            isMobileOpen={isMobileSidebarOpen}  // NEW: Pass mobile props
            onMobileToggle={setIsMobileSidebarOpen}  // NEW: Pass mobile props
          />
          <div className="post-container">
            <div className="flex items-center mb-4">
              <Image src="/pen.svg" alt="Menu Icon" width={25} height={25} className="object-contain mr-[4px]" />
              <h2 className="font-[400] text-[14px] leading-[22px] text-[#707070]" style={{ fontFamily: "'Public Sans', sans-serif" }}>
                Mindmap / {mindmapId ? "Edit Mindmap" : "Create Mindmap"}
              </h2>
            </div>
            <MindmapEditorSkeleton />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard">
      <Sidebar 
        onToggle={(collapsed) => setSidebarCollapsed(collapsed)} 
        isMobileOpen={isMobileSidebarOpen}  // NEW: Pass mobile props
        onMobileToggle={setIsMobileSidebarOpen}  // NEW: Pass mobile props
      />
      <div className={`main-content ${sidebarCollapsed ? "collapsed" : ""}`}>
        <CreateMinemapHeader
          onSave={() => setIsModalOpen(true)} // ✅ Changed: Now triggers the modal instead of direct save
          onCancel={handleCancel} // ✅ Unchanged: Still redirects
          saving={isLoading}
          collapsed={sidebarCollapsed}
          isMobileOpen={isMobileSidebarOpen}  // NEW: Pass mobile props
          onMobileToggle={setIsMobileSidebarOpen}  // NEW: Pass mobile props
        />
        <div className="post-container">
          <div className="flex items-center mb-4">
            <Image src="/pen.svg" alt="Menu Icon" width={25} height={25} className="object-contain mr-[4px]" />
            <h2 className="font-[400] text-[14px] leading-[22px] text-[#707070]" style={{ fontFamily: "'Public Sans', sans-serif" }}>
              Mindmap / {mindmapId ? "Edit Mindmap" : "Create Mindmap"}
            </h2>
          </div>

          <div className="editor-container">
            {/* ✅ Removed: <ReactFlowProvider> (not needed for Excalidraw) */}
            <MindmapContent
              mindmapId={mindmapId}
              initialTitle={title}
              initialContentBody={contentBody}
              initialCategoryId={initialCategoryId}
              initialTags={initialTags}
              // ✅ Removed: initialNodes and initialEdges
              // initialNodes={initialNodes}
              // initialEdges={initialEdges}
              // ✅ Added: Pass Excalidraw data
              initialExcalidrawData={initialExcalidrawData}
              isModalOpen={isModalOpen} // ✅ New: Pass lifted state
              setIsModalOpen={setIsModalOpen} // ✅ New: Pass setter
            />
            {/* ✅ Removed: </ReactFlowProvider> */}
          </div>
        </div>
      </div>
    </div>
  );
}