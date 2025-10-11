"use client";

import { useState } from "react";
import Image from "next/image";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation"; // ✅ For navigation
import Sidebar from "@/components/layout/Sidebar";
import CreatePageHeader from "@/components/layout/CreatePageHeader";
import { useContent, ContentType } from "@/hooks/useContent"; // Adjust path to your hook
import { useAuth } from "@/hooks/useAuth"; // Adjust path to your useAuth hook (e.g., "@/hooks/useAuth")
import "./PostPage.css";

// ✅ Dynamically import the editor to avoid SSR issues
const CreatePostEditor = dynamic(
  () => import("@/components/content/CreatePostEditor"),
  { ssr: false }
);

export default function PostPage() {
  // Lifted state from editor
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [saving, setSaving] = useState(false);

  // ✅ Use your auth hook (with exposed token and isAuthenticated)
  const { user, loading: authLoading, token, isAuthenticated } = useAuth();

  // ✅ Router for navigation
  const router = useRouter();

  // Use the content hook for posts
  const { createContent, loading: contentLoading, refetch } = useContent({
    type: "post" as ContentType,
    autoFetch: false,
  });

  // Combined loading state
  const isLoading = authLoading || contentLoading || saving;

  // ✅ Cancel handler: Reset form and navigate to posts dashboard
  const handleCancel = () => {
    // Optional: Reset form before leaving
    setTitle("");
    setBody("");
    // Navigate to /dashboard/posts (your posts list page)
    router.push("/dashboard/posts");
  };

  // Handler for Save (published: true) or Save as Draft (published: false)
  const handleSave = async (isPublished: boolean) => {
    if (!title.trim() || !body.trim() || !isAuthenticated || !token) {
      return; // Silently return if invalid (no messages)
    }

    setSaving(true);
    try {
      const newPostData: any = {  // Adjust type based on your AnyContent/Post schema
        title,
        body, // HTML from Tiptap editor (maps to content_body in DB via API)
        status: isPublished ? "published" : "draft", // Matches your DB schema
        // Add other fields if required by backend:
        // description: body.substring(0, 150) + "...", // Auto-generate if needed
        // category_id: null, // Or from state if you add category selection
      };

      // ✅ Temporary debug log (remove after testing)
      console.log("Sending status:", newPostData.status, "Data:", newPostData);

      // ✅ Pass token to include Authorization header
      await createContent(newPostData, token);
      
      refetch(); // Refresh content lists if needed elsewhere
      
      // Reset form after success (clear fields)
      setTitle("");
      setBody("");
    } catch (err: any) {
      console.error("Save error:", err);
      // Silently handle errors (no alerts or messages)
    } finally {
      setSaving(false);
    }
  };

  const handleSaveAsDraft = () => handleSave(false);
  const handleSavePublish = () => handleSave(true);

  // If auth is still loading, show a loader (optional)
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
        {/* Pass handlers and loading to header */}
        <CreatePageHeader
          onSave={handleSavePublish}
          onSaveAsDraft={handleSaveAsDraft}
          onCancel={handleCancel} // ✅ Pass cancel handler
          saving={isLoading || !isAuthenticated} // Disable if not authenticated
        />

        <div className="post-container">
          <div className="flex items-center mb-4">
            <Image
              src="/postlogo.png"
              alt="Menu Icon"
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
          />
        </div>
      </div>
    </div>
  );
}
