"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation"; // ✅ For redirect
import { useAuth } from "@/hooks/useAuth"; // ✅ For auth context
import Image from "next/image";
import Sidebar from "@/components/layout/Sidebar";
import MindmapEditor from "@/components/content/ExcalidrawEditor";
import "./PostPage.css";
import CreateMinemapHeader from "@/components/layout/CreateMinemapHeader";

export default function PostPage() {
  const router = useRouter();
  const { user, loading } = useAuth(); // ✅ check auth state

  // 🔐 Redirect if not authenticated
  useEffect(() => {
    if (!loading && !user) {
      router.push("/auth/login");
    }
  }, [user, loading, router]);

  const [editorType, setEditorType] = useState<"mindmap" | "excalidraw">("mindmap");

  // 🚫 Prevent rendering UI until auth check finishes
  if (loading || (!user && !loading)) return (
                <div className="dashboard">
                  <Sidebar />
                  <div className="main-content">
                    <p className="text-center text-gray-400 mt-10">Loading...</p>
                  </div>
                </div>
              );;

  return (
    <div className="dashboard">
      <Sidebar />
      <div className="main-content">
        <CreateMinemapHeader />

        <div className="post-container">
          {/* 🔹 Menu / Mindmap Title Row */}
          <div className="flex items-center mb-4">
            <Image
              src="/pen.svg"
              alt="Menu Icon"
              width={20}
              height={20}
              className="object-contain mr-[4px]"
            />
            <h2
              className="font-[400] text-[12px] leading-[22px] text-[#707070]"
              style={{ fontFamily: "'Public Sans', sans-serif" }}
            >
              Mindmap / Excalidraw Test
            </h2>
          </div>

          {/* 🧠 Editor Section */}
          <div className="editor-container" style={{ height: "85vh" }}>
            <MindmapEditor />
          </div>
        </div>
      </div>
    </div>
  );
}
