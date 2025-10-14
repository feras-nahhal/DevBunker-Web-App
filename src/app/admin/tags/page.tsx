"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";

import Image from "next/image";
import Header from "@/components/admin/Header";
import Sidebar from "@/components/admin/Sidebar";
import TagGrid from "@/components/admin/TagGrid";
import "./ExplorePage.css";

export default function ExplorePage() {
   // 🔐 Auth & Redirect Logic
      const router = useRouter();
      const { token, loading } = useAuth();
    
      useEffect(() => {
        if (!loading && !token) {
          router.push("/auth/login");
        }
      }, [loading, token, router]);
    
      // 🛑 Don’t render CategoryGrid until we know user is logged in
      if (loading || !token) {
          return (
            <div className="dashboard">
              <Sidebar />
              <div className="main-content">
                <p className="text-center text-gray-400 mt-10">Loading...</p>
              </div>
            </div>
          );
        }
      if (!token) return null; // ✅ Prevents unauthorized API call before redirect
  return (
    <div className="dashboard">
      <Sidebar />
      <div className="main-content">
        <Header />

        <div className="explore-container">
          {/* 🔹 Menu / Explore Title Row */}
          <div className="flex items-center mb-4">
            <Image
              src="/tagsidebar.png" // ✅ make sure image path is correct
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
              Tag/ Tag List
            </h2>
          </div>

          {/* 🔹 Grid Section */}
          <TagGrid />
        </div>
      </div>
    </div>
  );
}
