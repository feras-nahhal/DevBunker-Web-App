"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Sidebar from "@/components/layout/Sidebar";
import CreatePageHeader from "@/components/layout/CreatePageHeader";
import { useContent, ContentType } from "@/hooks/useContent";
import { AnyContent } from "@/types/content";
import { CONTENT_STATUS } from "@/lib/enums";
import "./PostPage.css";
import CreatePostSkeleton from "@/components/content/CreatePostSkeleton";
import { useAuthContext } from "@/hooks/AuthProvider";

interface Tag {
  id: string;
  name: string;
}

const CreatePostEditor = dynamic(
  () => import("@/components/content/CreatePostEditor"),
  { ssr: false }
);

export default function CreatePostPageInner() {
  const router = useRouter();
  const {token, loading } = useAuthContext();

  const [researchId, setResearchId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [saving, setSaving] = useState(false);
  const [selectedTags, setSelectedTags] = useState<Tag[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false); // NEW: Separate state for mobile sidebar
  const [ready, setReady] = useState(false);

  const {
    getContentById,
    createContent,
    updateContent,
    loading: contentLoading,
    refetch,
  } = useContent({
    type: "post" as ContentType,
    autoFetch: false,
  });

  // ✅ Get query parameter manually from window.location
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      setResearchId(params.get("id"));
    }
  }, []);

  useEffect(() => {
    if (!loading && token) setReady(true);
  }, [loading, token]);

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
        }
      } catch (err) {
        alert(`Error fetching post: ${err instanceof Error ? err.message : "Unknown error"}`);
      }
    };

    fetchResearch();
  }, [researchId, ready, getContentById, token]);

  const isLoading = loading || contentLoading || saving;

  const handleCancel = () => {
    setTitle("");
    setBody("");
    setSelectedTags([]);
    setSelectedCategoryId(null);
    router.push("/dashboard/posts");
  };

  const handleSave = async (isPublished: boolean) => {
    if (!title.trim() || !body.trim() || !token) {
      alert("Title, body, and token are required");
      return;
    }

    if (selectedTags.some((ref) => !ref.id)) {
      alert("References cannot be empty");
      return;
    }

    setSaving(true);
    try {
      const dataToSend: Partial<AnyContent> & {
        tag_ids?: string[];
        category_id?: string | null;
        status: string;
      } = {
        title,
        content_body: body,
        status: isPublished ? CONTENT_STATUS.PUBLISHED : CONTENT_STATUS.DRAFT,
        category_id: selectedCategoryId ?? undefined,
        tag_ids: selectedTags.map((t) => t.id),
      };

      const response = researchId
        ? await updateContent(researchId, dataToSend, token)
        : await createContent(dataToSend, token);

      if (!response) throw new Error("No response from API");

      refetch();
      router.push("/dashboard/posts");
    } catch (err) {
      console.error("Save error:", err);
      alert(`Error saving: ${err instanceof Error ? err.message : "Unknown error"}`);
    } finally {
      setSaving(false);
    }
  };

  const handleSaveAsDraft = () => handleSave(false);
  const handleSavePublish = () => handleSave(true);

  if (!ready || contentLoading) {
    return (
      <div className="dashboard">
        <Sidebar 
                                        onToggle={(collapsed) => setSidebarCollapsed(collapsed)} 
                                        isMobileOpen={isMobileSidebarOpen}  // NEW: Pass mobile props
                                        onMobileToggle={setIsMobileSidebarOpen}  // NEW: Pass mobile props
                                      />
        <div className={`main-content ${sidebarCollapsed ? "collapsed" : ""}`}>
          {/* 🔹 Header */}
          <CreatePageHeader
            onSave={handleSavePublish}
            onSaveAsDraft={handleSaveAsDraft}
            onCancel={handleCancel}
            saving={isLoading}
            collapsed={sidebarCollapsed}
            isMobileOpen={isMobileSidebarOpen}  // NEW: Pass mobile props
            onMobileToggle={setIsMobileSidebarOpen}  // NEW: Pass mobile props
          />
  
          {/* 🔹 Page Title Row */}
          <div className="post-container">
            <div className="flex items-center mb-4">
              <Image
                src="/plus.svg"
                alt="Research Icon"
                width={25}
                height={25}
                className="object-contain mr-[4px] relative top-[1px]"
              />
              <h2
                className="font-[400] text-[14px] leading-[22px] text-[#707070]"
                style={{ fontFamily: "'Public Sans', sans-serif" }}
              >
                Post / {researchId ? "Edit Post" : "Create Post"}
              </h2>
            </div>
  
            {/* 🧩 Skeleton */}
            <CreatePostSkeleton />
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
        <CreatePageHeader
          onSave={handleSavePublish}
          onSaveAsDraft={handleSaveAsDraft}
          onCancel={handleCancel}
          saving={isLoading}
          collapsed={sidebarCollapsed}
          isMobileOpen={isMobileSidebarOpen}  // NEW: Pass mobile props
          onMobileToggle={setIsMobileSidebarOpen}  // NEW: Pass mobile props
        />

        <div className="post-container">
          <div className="flex items-center mb-4">
            <Image
              src="/plus.svg"
              alt="Post Icon"
              width={25}
              height={25}
              className="object-contain mr-[4px] relative top-[1px]"
            />
            <h2
              className="font-[400] text-[14px] leading-[22px] text-[#707070]"
              style={{ fontFamily: "'Public Sans', sans-serif" }}
            >
              Post / {researchId ? "Edit Post" : "Create Post"}
            </h2>
          </div>

          <CreatePostEditor
            researchId={researchId}
            title={title}
            body={body}
            onTitleChange={setTitle}
            onBodyChange={setBody}
            onTagsChange={setSelectedTags}
            onCategoryChange={setSelectedCategoryId}
            initialCategoryId={selectedCategoryId}
            initialTags={selectedTags}
          />
        </div>
      </div>
    </div>
  );
}
