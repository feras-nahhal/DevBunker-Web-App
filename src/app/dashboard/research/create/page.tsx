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

interface Tag { id: string; name: string; }

const CreateResearchEditor = dynamic(
  () => import("@/components/content/CreateResearchEditor"),
  { ssr: false }
);

export default function CreateResearchPage() {
  const router = useRouter();

  // -----------------------------
  // Auth Hook
  // -----------------------------
  const { user, loading: authLoading, token, isAuthenticated } = useAuth();

  // -----------------------------
  // States (always declared first)
  // -----------------------------
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [saving, setSaving] = useState(false);
  const [selectedTags, setSelectedTags] = useState<Tag[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [selectedReferences, setSelectedReferences] = useState<string[]>([]);

  const { createContent, loading: contentLoading, refetch } = useContent({
    type: "research" as ContentType,
    autoFetch: false,
  });

  const isLoading = authLoading || contentLoading || saving;

  // -----------------------------
  // Redirect effect
  // -----------------------------
  useEffect(() => {
    if (!authLoading && !user) router.push("/auth/login");
  }, [user, authLoading, router]);

  // -----------------------------
  // Handlers
  // -----------------------------
  const handleCancel = () => {
    setTitle(""); setBody(""); setSelectedTags([]); setSelectedCategoryId(null); setSelectedReferences([]);
    router.push("/dashboard/research");
  };

  const handleSave = async (isPublished: boolean) => {
    if (!title.trim() || !body.trim() || !isAuthenticated || !token) {
      alert("Title, body, and authentication are required");
      return;
    }
    if (selectedReferences.some(ref => !ref.trim())) {
      alert("References cannot be empty");
      return;
    }

    setSaving(true);
    try {
      const newPostData: Partial<AnyContent> & { 
        tag_ids?: string[]; 
        status: string; 
        category_id?: string | null;
        references?: string[];
      } = {
        title,
        content_body: body,
        status: isPublished ? CONTENT_STATUS.PENDING_APPROVAL : CONTENT_STATUS.DRAFT,
        category_id: selectedCategoryId ?? undefined,
        tag_ids: selectedTags.map(t => t.id),
        references: selectedReferences,
      };

      const createResponse = await createContent(newPostData, token);
      if (!createResponse) throw new Error("No response from API");

      refetch();
      setTitle(""); setBody(""); setSelectedTags([]); setSelectedCategoryId(null); setSelectedReferences([]);
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
  return (
    <div className="dashboard">
      <Sidebar />
      <div className="main-content">
        {authLoading || !user ? (
          <div style={{ padding: "20px", textAlign: "center" }}>Loading...</div>
        ) : (
          <>
            <CreateReserchHeader
              onSave={handleSavePublish}
              onSaveAsDraft={handleSaveAsDraft}
              onCancel={handleCancel}
              saving={isLoading || !isAuthenticated}
            />

            <div className="post-container">
              <div className="flex items-center mb-4">
                <Image src="/plus.svg" alt="Research Icon" width={20} height={20} className="object-contain mr-[4px] relative top-[1px]" />
                <h2 className="font-[400] text-[12px] leading-[22px] text-[#707070]" style={{ fontFamily: "'Public Sans', sans-serif" }}>
                  Research / Create Research
                </h2>
              </div>

              <CreateResearchEditor
                title={title}
                body={body}
                onTitleChange={setTitle}
                onBodyChange={setBody}
                onTagsChange={setSelectedTags}
                onCategoryChange={setSelectedCategoryId}
                onReferencesChange={setSelectedReferences}
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
