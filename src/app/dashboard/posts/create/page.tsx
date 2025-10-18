"use client";
import { useState, useEffect } from "react";
import Image from "next/image";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/layout/Sidebar";
import CreatePageHeader from "@/components/layout/CreatePageHeader";
import { useContent, ContentType } from "@/hooks/useContent";
import { useAuth } from "@/hooks/useAuth";
import { AnyContent } from "@/types/content";
import { CONTENT_STATUS } from "@/lib/enums";
import "./PostPage.css";

// ✅ Define Tag type (or import from types/content.ts)
interface Tag {
  id: string;
  name: string;
}

// ✅ Dynamically import to avoid SSR issues
const CreatePostEditor = dynamic(
  () => import("@/components/content/CreatePostEditor"),
  { ssr: false }
);

export default function PostPage() {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [saving, setSaving] = useState(false);
  const [selectedTags, setSelectedTags] = useState<Tag[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);

  const { loading: authLoading, token, isAuthenticated, user } = useAuth(); // ✅ Added user for redirect check
  const router = useRouter();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const { createContent, loading: contentLoading, refetch } = useContent({
    type: "post" as ContentType,
    autoFetch: false,
  });

  const isLoading = authLoading || contentLoading || saving;

  // 🔐 Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/auth/login");
    }
  }, [authLoading, user, router]);

  // ✅ Cancel → clear & navigate
  const handleCancel = () => {
    setTitle("");
    setBody("");
    router.push("/dashboard/posts");
  };

  // ✅ Save handler
  const handleSave = async (isPublished: boolean) => {
    if (!title.trim() || !body.trim() || !isAuthenticated || !token) return;

    setSaving(true);
    try {
      console.log("🧭 Final Category ID Sent:", selectedCategoryId);

      // ✅ Explicitly type newPostData to match Partial<AnyContent>
      const newPostData: Partial<AnyContent> & {
        tag_ids?: string[];
        status: string;
        category_id?: string | null;
      } = {
        title,
        content_body: body,
        status: isPublished ? CONTENT_STATUS.PUBLISHED : CONTENT_STATUS.DRAFT,
        category_id: selectedCategoryId ?? undefined,
        tag_ids: selectedTags.map((t) => t.id),
      };

      console.log("📝 Sending Data:", newPostData);

      await createContent(newPostData, token);
      refetch();

      setTitle("");
      setBody("");
      setSelectedTags([]);
      setSelectedCategoryId(null);
    } catch (err) {
      console.error("Save error:", err);
    } finally {
      setSaving(false);
    }
  };

  const handleSaveAsDraft = () => handleSave(false);
  const handleSavePublish = () => handleSave(true);

  // 🚫 Prevent rendering UI until auth finishes or user is redirected
  if (authLoading || (!user && !authLoading)) return  (
        <div className="dashboard">
          <Sidebar onToggle={(collapsed) => setSidebarCollapsed(collapsed)} />
           <div className={`main-content ${sidebarCollapsed ? "collapsed" : ""}`}>
              <p className="text-center text-gray-400 mt-10">Loading...</p>
            </div>
        </div>
      );;

  return (
    <div className="dashboard">
      <Sidebar onToggle={(collapsed) => setSidebarCollapsed(collapsed)} />
         <div className={`main-content ${sidebarCollapsed ? "collapsed" : ""}`}>
        <CreatePageHeader
          onSave={handleSavePublish}
          onSaveAsDraft={handleSaveAsDraft}
          onCancel={handleCancel}
          saving={isLoading || !isAuthenticated}
          collapsed={sidebarCollapsed}
        />

        <div className="post-container">
          {/* 🔹 Header row */}
          <div className="flex items-center mb-4">
            <Image
              src="/pen.svg"
              alt="Post Icon"
              width={20}
              height={20}
              className="object-contain mr-[4px] relative top-[1px]"
            />
            <h2
              className="font-[400] text-[14px] leading-[22px] text-[#707070]"
              style={{ fontFamily: "'Public Sans', sans-serif" }}
            >
              Post / Create Post
            </h2>
          </div>

          {/* 🔹 Editor */}
          <CreatePostEditor
            title={title}
            body={body}
            onTitleChange={setTitle}
            onBodyChange={setBody}
            onTagsChange={setSelectedTags}
            onCategoryChange={setSelectedCategoryId}
          />
        </div>
      </div>
    </div>
  );
}
