"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Sidebar from "@/components/layout/Sidebar";
import CreateReserchHeader from "@/components/layout/CreateReserchHeader";
import { useContent, ContentType } from "@/hooks/useContent";
import { useAuth } from "@/hooks/useAuth";
import { AnyContent } from "@/types/content";
import { CONTENT_STATUS } from "@/lib/enums";
import "./PostPage.css";
import CreateResearchSkeleton from "@/components/content/CreateResearchSkeleton";
import { useAuthContext } from "@/hooks/AuthProvider";

interface Tag {
  id: string;
  name: string;
}

const CreateResearchEditor = dynamic(
  () => import("@/components/content/CreateResearchEditor"),
  { ssr: false }
);

export default function CreateResearchPage() {
  const router = useRouter();
  const { user,token, loading, isAuthenticated } = useAuthContext(); // ✅ check authentication state

  const [researchId, setResearchId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [saving, setSaving] = useState(false);
  const [selectedTags, setSelectedTags] = useState<Tag[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [selectedReferences, setSelectedReferences] = useState<string[]>([]);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [ready, setReady] = useState(false);

  const {
    getContentById,
    createContent,
    updateContent,
    loading: contentLoading,
    refetch,
  } = useContent({
    type: "research" as ContentType,
    autoFetch: false,
  });

  // ✅ Extract query param manually (no useSearchParams)
    useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const id = params.get("id");
      const initialTitle = params.get("title") || "";

      setResearchId(id);
      if (initialTitle) {
        setTitle(initialTitle);
      }
    }
  }, []);


  // ✅ Wait for token before doing anything
  useEffect(() => {
    if (!loading && token) {
      setReady(true);
    }
  }, [loading, token]);

  // ✅ Load existing research for editing, only when ready
  useEffect(() => {
    if (!researchId || !ready) return;

    const fetchResearch = async () => {
      try {
        const data = await getContentById(researchId);
        if (data) {
          setTitle(data.title || "");
          setBody(data.content_body || "");
          setSelectedCategoryId(data.category_id || null);
          setSelectedTags(data.tags || []);
          setSelectedReferences(data.references || []);
        }
      } catch (err) {
        alert(`Error fetching research: ${err instanceof Error ? err.message : "Unknown error"}`);
      }
    };

    fetchResearch();
  }, [researchId, ready, getContentById, token]);

  const isLoading = loading || contentLoading || saving;

  // -----------------------------
  // Handlers
  // -----------------------------
  const handleCancel = () => {
    setTitle("");
    setBody("");
    setSelectedTags([]);
    setSelectedCategoryId(null);
    setSelectedReferences([]);
    router.push("/dashboard/research");
  };

  const handleSave = async (isPublished: boolean) => {
    if (!title.trim() || !body.trim() || !token) {
      alert("Title, body, and token are required");
      return;
    }
    if (selectedReferences.some((ref) => !ref.trim())) {
      alert("References cannot be empty");
      return;
    }

    setSaving(true);
    try {
      const dataToSend: Partial<AnyContent> & {
        tag_ids?: string[];
        category_id?: string | null;
        references?: string[];
        status: string;
      } = {
        title,
        content_body: body,
        status: isPublished ? CONTENT_STATUS.PENDING_APPROVAL : CONTENT_STATUS.DRAFT,
        category_id: selectedCategoryId ?? undefined,
        tag_ids: selectedTags.map((t) => t.id),
        references: selectedReferences,
      };

      const response = researchId
        ? await updateContent(researchId, dataToSend, token)
        : await createContent(dataToSend, token);

      if (!response) throw new Error("No response from API");

      refetch();
      router.push("/dashboard/research");
    } catch (err) {
      console.error("Save error:", err);
      alert(`Error saving: ${err instanceof Error ? err.message : "Unknown error"}`);
    } finally {
      setSaving(false);
    }
  };

  const handleSaveAsDraft = () => handleSave(false);
  const handleSavePublish = () => handleSave(true);

  // -----------------------------
  // Render
  // -----------------------------
  if (!ready || contentLoading) {
  return (
    <div className="dashboard">
      <Sidebar onToggle={(collapsed) => setSidebarCollapsed(collapsed)} />
      <div className={`main-content ${sidebarCollapsed ? "collapsed" : ""}`}>
        {/* 🔹 Header */}
        <CreateReserchHeader
          onSave={handleSavePublish}
          onSaveAsDraft={handleSaveAsDraft}
          onCancel={handleCancel}
          saving={isLoading}
          collapsed={sidebarCollapsed}
        />

        {/* 🔹 Page Title Row */}
        <div className="post-container">
          <div className="flex items-center mb-4">
            <Image
              src="/plus.svg"
              alt="Research Icon"
              width={20}
              height={20}
              className="object-contain mr-[4px] relative top-[1px]"
            />
            <h2
              className="font-[400] text-[14px] leading-[22px] text-[#707070]"
              style={{ fontFamily: "'Public Sans', sans-serif" }}
            >
              Research / {researchId ? "Edit Research" : "Create Research"}
            </h2>
          </div>

          {/* 🧩 Skeleton */}
          <CreateResearchSkeleton />
        </div>
      </div>
    </div>
  );
}


  return (
    <div className="dashboard">
      <Sidebar onToggle={(collapsed) => setSidebarCollapsed(collapsed)} />
      <div className={`main-content ${sidebarCollapsed ? "collapsed" : ""}`}>
        <CreateReserchHeader
          onSave={handleSavePublish}
          onSaveAsDraft={handleSaveAsDraft}
          onCancel={handleCancel}
          saving={isLoading}
          collapsed={sidebarCollapsed}
        />

        <div className="post-container">
          <div className="flex items-center mb-4">
            <Image
              src="/plus.svg"
              alt="Research Icon"
              width={20}
              height={20}
              className="object-contain mr-[4px] relative top-[1px]"
            />
            <h2
              className="font-[400] text-[14px] leading-[22px] text-[#707070]"
              style={{ fontFamily: "'Public Sans', sans-serif" }}
            >
              Research / {researchId ? "Edit Research" : "Create Research"}
            </h2>
          </div>

          <CreateResearchEditor
            researchId={researchId}
            title={title}
            body={body}
            onTitleChange={setTitle}
            onBodyChange={setBody}
            onTagsChange={setSelectedTags}
            onCategoryChange={setSelectedCategoryId}
            onReferencesChange={setSelectedReferences}
            initialCategoryId={selectedCategoryId}
            initialTags={selectedTags}
            initialReferences={selectedReferences}
          />
        </div>
      </div>
    </div>
  );
}
