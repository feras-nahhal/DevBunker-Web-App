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
import UnsavedChangesPopup from "@/components/content/UnsavedChangesPopup";

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

  // Track initial values for unsaved changes detection
  const [initialTitle, setInitialTitle] = useState("");
  const [initialBody, setInitialBody] = useState("");
  const [initialTags, setInitialTags] = useState<Tag[]>([]);
  const [initialCategoryId, setInitialCategoryId] = useState<string | null>(null);

  // States for unsaved changes modal
  const [showUnsavedModal, setShowUnsavedModal] = useState(false);
  const [pendingHref, setPendingHref] = useState<string | null>(null);
  

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

  // Set initial values for new posts
  useEffect(() => {
    if (!researchId && ready) {
      setInitialTitle("");
      setInitialBody("");
      setInitialCategoryId(null);
      setInitialTags([]);
    }
  }, [researchId, ready]);

  // Compute if there are unsaved changes
const hasUnsavedChanges =
  title !== initialTitle ||
  body !== initialBody ||
  selectedCategoryId !== initialCategoryId ||
  JSON.stringify(selectedTags) !== JSON.stringify(initialTags);

  // Add beforeunload listener to warn on unsaved changes (for browser-level navigation)
useEffect(() => {
  const handleBeforeUnload = (event: BeforeUnloadEvent) => {
    if (hasUnsavedChanges) {
      event.preventDefault();
      event.returnValue = "You have unsaved changes. Are you sure you want to leave?";
    }
  };

  if (hasUnsavedChanges) {
    window.addEventListener("beforeunload", handleBeforeUnload);
  }

  return () => {
    window.removeEventListener("beforeunload", handleBeforeUnload);
  };
}, [hasUnsavedChanges]);

  // Function to check before navigation (returns true to proceed, false to prevent)
const handleBeforeNavigate = (href: string) => {
  if (hasUnsavedChanges) {
    setPendingHref(href);
    setShowUnsavedModal(true);
    return false; // Prevent navigation and show modal
  }
  return true; // Allow navigation
};

// Handlers for modal buttons
const handleLeave = () => {
  if (pendingHref) {
    router.push(pendingHref);
  }
  setShowUnsavedModal(false);
  setPendingHref(null);
};

const handleStay = () => {
  setShowUnsavedModal(false);
  setPendingHref(null);
};

  const isLoading = loading || contentLoading || saving;

  const handleCancel = () => {
    setTitle("");
    setBody("");
    setSelectedTags([]);
    setSelectedCategoryId(null);
    router.push("/dashboard/posts");
  };

  const handleSave = async (visibility: "private" | "public" | boolean) => {
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
        visibility?: "private" | "public";
      } = {
        title,
        content_body: body,
        status:
          visibility === true || visibility === "public"
            ? CONTENT_STATUS.PUBLISHED
            : CONTENT_STATUS.DRAFT,
        category_id: selectedCategoryId ?? undefined,
        tag_ids: selectedTags.map((t) => t.id),
      };

      // Only add visibility if dropdown was used
    if (visibility === "private" || visibility === "public") {
      dataToSend.visibility = visibility;
    }

      const response = researchId
        ? await updateContent(researchId, dataToSend, token)
        : await createContent(dataToSend, token);

      if (!response) throw new Error("No response from API");

      refetch();

      // Inside handleSave, after successful response:
      setInitialTitle(title);
      setInitialBody(body);
      setInitialCategoryId(selectedCategoryId);
      setInitialTags(selectedTags);

      router.push("/dashboard/posts");
    } catch (err) {
      console.error("Save error:", err);
      alert(`Error saving: ${err instanceof Error ? err.message : "Unknown error"}`);
    } finally {
      setSaving(false);
    }
  };

  const handleSaveAsDraft = () => handleSave(false);


  if (!ready || contentLoading) {
    return (
      <div className="dashboard">
        <Sidebar 
                                        onToggle={(collapsed) => setSidebarCollapsed(collapsed)} 
                                        isMobileOpen={isMobileSidebarOpen}  // NEW: Pass mobile props
                                        onMobileToggle={setIsMobileSidebarOpen}  // NEW: Pass mobile props
                                        onBeforeNavigate={handleBeforeNavigate}  // ADD THIS PROP
                                      />
        <div className={`main-content ${sidebarCollapsed ? "collapsed" : ""}`}>
          {/* 🔹 Header */}
          <CreatePageHeader
            onSave={async (visibility: "private" | "public") => {
              await handleSave(visibility);
            }}
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
                                      onBeforeNavigate={handleBeforeNavigate}  // ADD THIS PROP
                                    />
      <div className={`main-content ${sidebarCollapsed ? "collapsed" : ""}`}>
        <CreatePageHeader
          onSave={async (visibility: "private" | "public") => {
            await handleSave(visibility);
          }}
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
      {/* Unsaved Changes Modal */}
{showUnsavedModal && (
  <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[9999] flex justify-center items-center">
    <UnsavedChangesPopup
      type="Post"
      onConfirm={handleLeave}
      onClose={handleStay}
  
    />
  </div>
)}
    </div>
  );
}
