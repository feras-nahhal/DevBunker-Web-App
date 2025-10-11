"use client";

import Image from "next/image";
import Header from "@/components/layout/Header";
import Sidebar from "@/components/layout/Sidebar";
import "./ExplorePage.css";
import SettingsPopup from "@/components/content/SettingsPage";
import SettingsPage from "@/components/content/SettingsPage";

export default function ExplorePage() {
  return (
    <div className="dashboard">
      <Sidebar />
      <div className="main-content">
        <Header />

        <div className="explore-container">
          {/* 🔹 Menu / Explore Title Row */}
          <div className="flex items-center mb-4">
            <Image
              src="/setting_logo.png" // ✅ make sure image path is correct
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
              Menu/ Settings
            </h2>
          </div>

         
                    {/* Centered Settings Card */}
          <div className="flex justify-center items-start mt-8"> {/* Wrapper for centering */}
            <SettingsPage />
          </div>
        </div>
      </div>
    </div>
  );
}
