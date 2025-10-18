"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import Image from "next/image";
import Sidebar from "@/components/layout/Sidebar";
import MindmapEditor from "@/components/content/ExcalidrawEditor";
import CreateMinemapHeader from "@/components/layout/CreateMinemapHeader";
import "./PostPage.css";

export default function PostPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      router.push("/auth/login");
    }
  }, [user, loading, router]);

  if (loading || (!user && !loading))
    return (
      <div className="dashboard">
        <Sidebar onToggle={(collapsed) => setSidebarCollapsed(collapsed)} />
        <div className={`main-content ${sidebarCollapsed ? "collapsed" : ""}`}>
          <p className="text-center text-gray-400 mt-10">Loading...</p>
        </div>
      </div>
    );

  return (
    <div className="dashboard">
      <Sidebar onToggle={(collapsed) => setSidebarCollapsed(collapsed)} />
      <div className={`main-content ${sidebarCollapsed ? "collapsed" : ""}`}>
        <CreateMinemapHeader collapsed={sidebarCollapsed}  />

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
              className="font-[400] text-[14px] leading-[22px] text-[#707070]"
              style={{ fontFamily: "'Public Sans', sans-serif" }}
            >
              Mindmap / Excalidraw Test
            </h2>
          </div>

          {/* 🧠 Editor Section */}
          <div className="editor-container">
            <MindmapEditor />
          </div>
        </div>
      </div>
    </div>
  );
}
