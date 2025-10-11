"use client";
import { useState } from "react";
import Image from "next/image";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/layout/Sidebar";
import CreatePageHeader from "@/components/layout/CreatePageHeader";
import { useContent, ContentType } from "@/hooks/useContent";
import { useAuth } from "@/hooks/useAuth";
import { AnyContent} from "@/types/content"; 
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

  const { loading: authLoading, token, isAuthenticated } = useAuth();
  const router = useRouter();

  const { createContent, loading: contentLoading, refetch } = useContent({
    type: "post" as ContentType,
    autoFetch: false,
  });

  const isLoading = authLoading || contentLoading || saving;

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
      
      // ✅ Explicitly type newPostData to match Partial<AnyContent> (allows category_id: string | null)
      const newPostData: Partial<AnyContent> & { 
        tag_ids?: string[]; 
        status: string; 
        category_id?: string | null; // ✅ Explicit null allowance
      } = {
        title,
        content_body: body, // Maps to content_body in schema
        status: isPublished ? CONTENT_STATUS.PUBLISHED : CONTENT_STATUS.DRAFT, // Use enum values
        category_id: selectedCategoryId ?? undefined, // ✅ Send null directly (schema allows it)
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

  if (authLoading) {
    return (
      <div className="dashboard">
        <Sidebar />
        <div className="main-content">
          <div style={{ padding: "20px", textAlign: "center" }}>Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard">
      <Sidebar />
      <div className="main-content">
        <CreatePageHeader
          onSave={handleSavePublish}
          onSaveAsDraft={handleSaveAsDraft}
          onCancel={handleCancel}
          saving={isLoading || !isAuthenticated}
        />

        <div className="post-container">
          <div className="flex items-center mb-4">
            <Image
              src="/postlogo.png"
              alt="Post Icon"
              width={20}
              height={20}
              className="object-contain mr-[4px] relative top-[1px]"
            />
            <h2
              className="font-[400] text-[12px] leading-[22px] text-[#707070]"
              style={{
                fontFamily: "'Public Sans', sans-serif",
              }}
            >
              Post / Create Post
            </h2>
          </div>

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
