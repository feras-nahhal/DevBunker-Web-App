"use client";

import Image from "next/image";
import Header from "@/components/layout/Header";
import Sidebar from "@/components/layout/Sidebar";
import ContentGrid from "@/components/content/ContentGrid";
import "./ResearchPage.css";

export default function ResearchPage() {
  return (
    <div className="dashboard">
      <Sidebar />
      <div className="main-content">
        <Header />

        <div className="Research-container">
          {/* 🔹 Menu / Research Title Row */}
          <div className="flex items-center mb-4">
            <Image
              src="/Reserchnew.png" // ✅ make sure image path is correct
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
              Research /Research List
            </h2>
          </div>

          {/* 🔹 Grid Section */}
          <ContentGrid type="research" />
        </div>
      </div>
    </div>
  );
}
