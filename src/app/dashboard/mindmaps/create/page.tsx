"use client";
import { Node, Edge } from "reactflow";
import { useState, useEffect, useMemo } from "react"; // ✅ Added useMemo for stable props
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import Image from "next/image";
import Sidebar from "@/components/layout/Sidebar";
import ExcalidrawEditor from "@/components/content/ExcalidrawEditor"; // ✅ Fixed import (assuming MindmapEditor is the file name)
import CreateMinemapHeader from "@/components/layout/CreateMinemapHeader";
import { useContent, ContentType } from "@/hooks/useContent"; // ✅ Added for fetching/updating
import { AnyContent } from "@/types/content";
import { CONTENT_STATUS } from "@/lib/enums";
import { ReactFlowProvider } from "reactflow"; // ✅ Added for React Flow provider
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
  const router = useRouter();
  const { user, loading: authLoading, token } = useAuth();

  const [mindmapId, setMindmapId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [contentBody, setContentBody] = useState(""); // ✅ Renamed from "description" to "contentBody"
  const [saving, setSaving] = useState(false);
  const [selectedTags, setSelectedTags] = useState<Tag[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [ready, setReady] = useState(false);
  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]); // ✅ Added for mindmap edges

  const {
    getContentById,
    createContent,
    updateContent,
    loading: contentLoading,
    refetch,
  } = useContent({
    type: "mindmap" as ContentType, // ✅ Changed to "mindmap"
    autoFetch: false,
  });

  // ✅ Get query parameter manually from window.location (like post page)
  useEffect(() => {
    if (typeof window !== "undefined") { // ✅ Fixed typo: "undefined" not ""
      const params = new URLSearchParams(window.location.search);
      setMindmapId(params.get("id"));
    }
  }, []);

  useEffect(() => {
    if (!authLoading && token) setReady(true);
  }, [authLoading, token]);

  // ✅ Fetch mindmap data if editing (like post page)
  useEffect(() => {
    if (!mindmapId || !ready) return;

    const fetchMindmap = async () => {
      try {
        const data = await getContentById(mindmapId);
        if (data) {
          setTitle(data.title || "");
          setContentBody(data.content_body || ""); // ✅ Changed from "data.description" to "data.content_body"
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
  }, [mindmapId, ready, getContentById, token]);

  const isLoading = authLoading || contentLoading || saving;

  const handleCancel = () => {
    setTitle("");
    setContentBody(""); // ✅ Updated
    setSelectedTags([]);
    setSelectedCategoryId(null);
    setNodes([]);
    setEdges([]);
    router.push("/dashboard/mindmaps"); // ✅ Adjust route if needed
  };

  const handleSave = async (isPublished: boolean) => {
    if (!title.trim() || !token) {
      alert("Title and token are required");
      return;
    }

    //s
    setSaving(true);
    try {
      const dataToSend: Partial<AnyContent> & {
        tag_ids?: string[];
        category_id?: string | null;
        status: string;
        content_body?: string; // ✅ Changed from "description" to "content_body"
        excalidraw_data?: ExcalidrawData;
      } = {
        title,
        content_body: contentBody, // ✅ Changed from "description" to "content_body"
        excalidraw_data: { nodes, edges },
        status: isPublished ? CONTENT_STATUS.PUBLISHED : CONTENT_STATUS.DRAFT,
        category_id: selectedCategoryId ?? undefined,
        tag_ids: selectedTags.map((t) => t.id),
      };

      const response = mindmapId
        ? await updateContent(mindmapId, dataToSend, token)
        : await createContent(dataToSend, token);

      if (!response) throw new Error("No response from API");

      refetch();
      router.push("/dashboard/mindmaps"); // ✅ Adjust route if needed
    } catch (err) {
      console.error("Save error:", err);
      alert(`Error saving: ${err instanceof Error ? err.message : "Unknown error"}`);
    } finally {
      setSaving(false);
    }
  };

  const handleSaveAsDraft = () => handleSave(false);
  const handleSavePublish = () => handleSave(true);

  // ✅ Stable props to prevent re-renders (like post page)
  const initialTags = useMemo(() => selectedTags, [selectedTags]);
  const initialCategoryId = useMemo(() => selectedCategoryId || "", [selectedCategoryId]);
  const initialNodes = useMemo(() => nodes, [nodes]);
  const initialEdges = useMemo(() => edges, [edges]);

  if (!ready || contentLoading) {
    return (
      <div className="dashboard">
        <Sidebar onToggle={(collapsed) => setSidebarCollapsed(collapsed)} />
        <div className={`main-content ${sidebarCollapsed ? "collapsed" : ""}`}>
          <p className="text-center text-gray-400 mt-10">Loading Mindmap Data ...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard">
      <Sidebar onToggle={(collapsed) => setSidebarCollapsed(collapsed)} />
      <div className={`main-content ${sidebarCollapsed ? "collapsed" : ""}`}>
        <CreateMinemapHeader
         
        />

        <div className="post-container">
          <div className="flex items-center mb-4">
            <Image
              src="/pen.svg"
              alt="Menu Icon"
              width={20}
              height={20}
              className="object-contain mr-[4px]"
            />
            <h2
              className="font-[400] text-[14px] leading-[22px] text-[#707070]"
              style={{ fontFamily: "'Public Sans', sans-serif" }}
            >
              Mindmap / {mindmapId ? "Edit Mindmap" : "Create Mindmap"}
            </h2>
          </div>

          {/* 🧠 Editor Section */}
          <div className="editor-container">
            <ReactFlowProvider> {/* ✅ Added wrapper for React Flow */}
              <ExcalidrawEditor
                mindmapId={mindmapId}
                initialTitle={title}
                initialContentBody={contentBody} // ✅ Changed from "initialDescription" to "initialContentBody"
                initialCategoryId={initialCategoryId}
                initialTags={initialTags}
                initialNodes={initialNodes}
                initialEdges={initialEdges}
              />
            </ReactFlowProvider> {/* ✅ Close wrapper */}
          </div>
        </div>
      </div>
    </div>
  );
}
