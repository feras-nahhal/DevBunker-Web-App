"use client";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useEffect } from "react";
import Image from "next/image";
import Sidebar from "@/components/layout/Sidebar";
import "./ExplorePage.css";
import NotificationsGrid from "@/components/admin/NotificationsGrid";
import HeaderOther from "@/components/layout/HeaderOther";

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
        <HeaderOther />

        <div className="explore-container">
          {/* 🔹 Menu / Explore Title Row */}
          <div className="flex items-center mb-4">
            <Image
              src="/pillicon.png" // ✅ make sure image path is correct
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
              Update/ Notifications
            </h2>
          </div>

          {/* 🔹 Grid Section */}
          <NotificationsGrid />
        </div>
      </div>
    </div>
  );
}
