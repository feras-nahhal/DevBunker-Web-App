"use client";
import { useState } from "react";
import Image from "next/image";
import Sidebar from "@/components/layout/Sidebar";
import MindmapEditor from "@/components/content/ExcalidrawEditor";
import "./PostPage.css";
import CreateMinemapHeader from "@/components/layout/CreateMinemapHeader";

export default function PostPage() {
  const [editorType, setEditorType] = useState<"mindmap" | "excalidraw">("mindmap");

  return (
    <div className="dashboard">
      <Sidebar />
      <div className="main-content">
        <CreateMinemapHeader />

        <div className="post-container">
          <div className="flex items-center mb-4">
            <Image
              src="/postlogo.png"
              alt="Menu Icon"
              width={20}
              height={20}
              className="object-contain mr-[4px]"
            />
            <h2 className="font-[400] text-[12px] leading-[22px] text-[#707070]">
              Mindmap / Excalidraw Test
            </h2>
          </div>

  

          <div className="editor-container" style={{ height: "85vh" }}>
          <MindmapEditor />
        </div>

        </div>
      </div>
    </div>
  );
}
