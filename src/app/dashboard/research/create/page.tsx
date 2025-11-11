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
import UnsavedChangesPopup from "@/components/content/UnsavedChangesPopup";
import { set } from "zod";

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
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false); // NEW: Separate state for mobile sidebar
  const [ready, setReady] = useState(false);

  // Track initial values for unsaved changes detection
  const [initialTitle, setInitialTitle] = useState("");
  const [initialBody, setInitialBody] = useState("");
  const [initialTags, setInitialTags] = useState<Tag[]>([]);
  const [initialCategoryId, setInitialCategoryId] = useState<string | null>(null);
  const [initialReferences, setInitialReferences] = useState<string[]>([]);

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

  
  // Set initial values for new posts
  useEffect(() => {
    if (!researchId && ready) {
      setInitialTitle("");
      setInitialBody("");
      setInitialCategoryId(null);
      setInitialTags([]);
      setInitialReferences([]);
    }
  }, [researchId, ready]);

    // Compute if there are unsaved changes
  const hasUnsavedChanges =
    title !== initialTitle ||
    body !== initialBody ||
    selectedCategoryId !== initialCategoryId ||
    JSON.stringify(selectedTags) !== JSON.stringify(initialTags)||
    JSON.stringify(selectedReferences) !== JSON.stringify(initialReferences);

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

 


  const isLoading = loading || contentLoading || saving;

  // -----------------------------
  // Handlers
  // -----------------------------

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

      // Inside handleSave, after successful response:
      setInitialTitle(title);
      setInitialBody(body);
      setInitialCategoryId(selectedCategoryId);
      setInitialTags(selectedTags);
      setInitialReferences(selectedReferences);

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
      <Sidebar 
        onToggle={(collapsed) => setSidebarCollapsed(collapsed)} 
        isMobileOpen={isMobileSidebarOpen}  // NEW: Pass mobile props
        onMobileToggle={setIsMobileSidebarOpen}  // NEW: Pass mobile props
        onBeforeNavigate={handleBeforeNavigate} // NEW: Pass navigation guard
      />
      <div className={`main-content ${sidebarCollapsed ? "collapsed" : ""}`}>
        {/* 🔹 Header */}
        <CreateReserchHeader
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
      <Sidebar 
        onToggle={(collapsed) => setSidebarCollapsed(collapsed)} 
        isMobileOpen={isMobileSidebarOpen}  // NEW: Pass mobile props
        onMobileToggle={setIsMobileSidebarOpen}  // NEW: Pass mobile props
        onBeforeNavigate={handleBeforeNavigate} // NEW: Pass navigation guard
      />
      <div className={`main-content ${sidebarCollapsed ? "collapsed" : ""}`}>
        <CreateReserchHeader
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
              alt="Research Icon"
              width={25}
              height={25}
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
      {/* Unsaved Changes Modal */}
      {showUnsavedModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[9999] flex justify-center items-center">
          <UnsavedChangesPopup
          type="Research"
            onConfirm={handleLeave}
            onClose={handleStay}
        
          />
        </div>
      )}
    </div>
  );
}
