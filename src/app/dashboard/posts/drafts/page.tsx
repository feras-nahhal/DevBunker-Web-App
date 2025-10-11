"use client";

import Image from "next/image";
import Header from "@/components/layout/Header";
import Sidebar from "@/components/layout/Sidebar";
import DraftGrid from "@/components/content/DraftGrid";
import "./PostDraftPage.css";

export default function PostPage() {
  return (
    <div className="dashboard">
      <Sidebar />
      <div className="main-content">
        <Header />

        <div className="post-container">
          {/* 🔹 Menu / PostPage Title Row */}
          <div className="flex items-center mb-4">
            <Image
              src="/postlogo.png" // ✅ make sure image path is correct
              alt="Menu Icon"
              width={20} // Figma-like size (clean & aligned)
              height={20}
              className="object-contain mr-[4px] relative top-[1px]" // 👈 tight spacing & perfect vertical alignment
            />
            <h2
              className="font-[400] text-[12px] leading-[22px] text-[#707070]"
              style={{
                fontFamily: "'Public Sans', sans-serif",
              }}
            >
              Post /Draft
            </h2>
          </div>

          {/* 🔹 Grid Section */}
          <DraftGrid type="post" />
        </div>
      </div>
    </div>
  );
}
