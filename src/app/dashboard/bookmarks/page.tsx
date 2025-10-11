"use client";

import Image from "next/image";
import Header from "@/components/layout/Header";
import Sidebar from "@/components/layout/Sidebar";
import BookmarksGrid from "@/components/content/BookmarksGrid";
import "./ExplorePage.css";

export default function BookmarksPage() {
  return (
    <div className="dashboard">
      <Sidebar />
      <div className="main-content">
        <Header />

        <div className="explore-container">
          {/* 🔹 Menu / Explore Title Row */}
          <div className="flex items-center mb-4">
            <Image
              src="/bookmarklogo.png"
              alt="Menu Icon"
              width={20}
              height={20}
              className="object-contain mr-[4px] relative top-[1px]"
            />
            <h2
              className="font-[400] text-[12px] leading-[22px] text-[#707070]"
              style={{ fontFamily: "'Public Sans', sans-serif" }}
            >
              Menu / Bookmarks
            </h2>
          </div>

       

          {/* 🔹 Grid Section */}
          <BookmarksGrid />
        </div>
      </div>
    </div>
  );
}
