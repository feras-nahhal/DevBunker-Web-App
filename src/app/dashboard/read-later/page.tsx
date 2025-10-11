"use client";

import Image from "next/image";
import Header from "@/components/layout/Header";
import Sidebar from "@/components/layout/Sidebar";
import ReadLaterGrid from "@/components/content/ReadLaterGrid"; // 🔹 new grid for read later
import "./ExplorePage.css";

export default function ReadLaterPage() {
  return (
    <div className="dashboard">
      <Sidebar />
      <div className="main-content">
        <Header />

        <div className="explore-container">
          {/* 🔹 Menu / Explore Title Row */}
          <div className="flex items-center mb-4">
            <Image
              src="/readlaterlogo.png"
              alt="Menu Icon"
              width={20}
              height={20}
              className="object-contain mr-[4px] relative top-[1px]"
            />
            <h2
              className="font-[400] text-[12px] leading-[22px] text-[#707070]"
              style={{ fontFamily: "'Public Sans', sans-serif" }}
            >
              Menu / Read Later
            </h2>
          </div>

          {/* 🔹 Read Later Grid Section */}
          <ReadLaterGrid />
        </div>
      </div>
    </div>
  );
}
