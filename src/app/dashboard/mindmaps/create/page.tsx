"use client";
import { Node, Edge } from "reactflow";
import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

import Sidebar from "@/components/layout/Sidebar";
import ExcalidrawEditor from "@/components/content/ExcalidrawEditor";
import CreateMinemapHeader from "@/components/layout/CreateMinemapHeader";
import MindmapEditorSkeleton from "@/components/content/MindmapEditorSkeleton";

import { useContent, ContentType } from "@/hooks/useContent";
import { useAuthContext } from "@/hooks/AuthProvider";
import { AnyContent } from "@/types/content";
import { CONTENT_STATUS } from "@/lib/enums";
import { ReactFlowProvider } from "reactflow";
import "./PostPage.css";

interface Tag {
  id: string;
  name: string;
}
interface ExcalidrawData {
  nodes: Node[];
  edges: Edge[];
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
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [ready, setReady] = useState(false);
  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);


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
          setNodes(data.excalidraw_data?.nodes || []);
          setEdges(data.excalidraw_data?.edges || []);
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
    setNodes([]);
    setEdges([]);
    router.push("/dashboard/mindmaps");
  };

  const initialTags = useMemo(() => selectedTags, [selectedTags]);
  const initialCategoryId = useMemo(() => selectedCategoryId || "", [selectedCategoryId]);
  const initialNodes = useMemo(() => nodes, [nodes]);
  const initialEdges = useMemo(() => edges, [edges]);

  if (!ready || contentLoading) {
    return (
      <div className="dashboard">
        <Sidebar onToggle={(collapsed) => setSidebarCollapsed(collapsed)} />
        <div className={`main-content ${sidebarCollapsed ? "collapsed" : ""}`}>
          <CreateMinemapHeader
           onSave={() => setIsModalOpen(true)} // ✅ Changed: Now triggers the modal instead of direct save
          onCancel={handleCancel} // ✅ Unchanged: Still redirects
            saving={isLoading}
            collapsed={sidebarCollapsed} />
          <div className="post-container">
            <div className="flex items-center mb-4">
              <Image src="/pen.svg" alt="Menu Icon" width={20} height={20} className="object-contain mr-[4px]" />
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
      <Sidebar onToggle={(collapsed) => setSidebarCollapsed(collapsed)} />
      <div className={`main-content ${sidebarCollapsed ? "collapsed" : ""}`}>
        <CreateMinemapHeader
         onSave={() => setIsModalOpen(true)} // ✅ Changed: Now triggers the modal instead of direct save
          onCancel={handleCancel} // ✅ Unchanged: Still redirects
            saving={isLoading}
            collapsed={sidebarCollapsed}
         />
        <div className="post-container">
          <div className="flex items-center mb-4">
            <Image src="/pen.svg" alt="Menu Icon" width={20} height={20} className="object-contain mr-[4px]" />
            <h2 className="font-[400] text-[14px] leading-[22px] text-[#707070]" style={{ fontFamily: "'Public Sans', sans-serif" }}>
              Mindmap / {mindmapId ? "Edit Mindmap" : "Create Mindmap"}
            </h2>
          </div>

          <div className="editor-container">
            <ReactFlowProvider>
              <ExcalidrawEditor
                mindmapId={mindmapId}
                initialTitle={title}
                initialContentBody={contentBody}
                initialCategoryId={initialCategoryId}
                initialTags={initialTags}
                initialNodes={initialNodes}
                initialEdges={initialEdges}
                isModalOpen={isModalOpen} // ✅ New: Pass lifted state
                setIsModalOpen={setIsModalOpen} // ✅ New: Pass setter
              />
            </ReactFlowProvider>
          </div>
        </div>
      </div>
    </div>
  );
}
