"use client";
import { useRouter } from "next/navigation";

import { useEffect, useState } from "react";
import Image from "next/image";
import HeaderOther from "@/components/layout/HeaderOther";
import Sidebar from "@/components/layout/Sidebar";
import "./ExplorePage.css";
import SettingsPage from "@/components/content/SettingsPage";
import SettingsPageSkeleton from "@/components/content/SettingsPageSkeleton";
import { useAuthContext } from "@/hooks/AuthProvider";

export default function ExplorePage() {
  // 🔐 Auth & Redirect Logic
  const router = useRouter();
  const { user, token, loading, isAuthenticated } = useAuthContext();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false); // NEW: Separate state for mobile sidebar

  useEffect(() => {
    if (!loading && !token) {
      router.push("/auth/login");
    }
  }, [loading, token, router]);

  // 🛑 Don’t render CategoryGrid until we know user is logged in

  if (loading || !token) {
    return (
      <div className="dashboard">
        <Sidebar 
                           onToggle={(collapsed) => setSidebarCollapsed(collapsed)} 
                           isMobileOpen={isMobileSidebarOpen}  // NEW: Pass mobile props
                           onMobileToggle={setIsMobileSidebarOpen}  // NEW: Pass mobile props
                         />
        <div className={`main-content ${sidebarCollapsed ? "collapsed" : ""}`}>
          <HeaderOther 
        collapsed={sidebarCollapsed}
        isMobileOpen={isMobileSidebarOpen}  // NEW: Pass mobile props
        onMobileToggle={setIsMobileSidebarOpen}  // NEW: Pass mobile props
         />

          <div className="explore-container">
            {/* 🔹 Menu / Settings Title Row */}
            <div className="flex items-center mb-4">
              <Image
                src="/setting.svg"
                alt="Menu Icon"
                width={25}
                height={25}
                className="object-contain mr-[4px] relative top-[1px]"
              />
              <h2
                className="font-[400] text-[14px] leading-[22px] text-[#707070]"
                style={{ fontFamily: "'Public Sans', sans-serif" }}
              >
                Menu / Settings
              </h2>
            </div>

            {/* 🧩 Centered Skeleton Card */}
            <div className="flex justify-center items-start mt-8">
              <SettingsPageSkeleton />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!token) return null; // ✅ Prevents unauthorized API call before redirect

  return (
    <div className="dashboard">
      <Sidebar 
                         onToggle={(collapsed) => setSidebarCollapsed(collapsed)} 
                         isMobileOpen={isMobileSidebarOpen}  // NEW: Pass mobile props
                         onMobileToggle={setIsMobileSidebarOpen}  // NEW: Pass mobile props
                       />
      <div className={`main-content ${sidebarCollapsed ? "collapsed" : ""}`}>
        <HeaderOther 
        collapsed={sidebarCollapsed}
        isMobileOpen={isMobileSidebarOpen}  // NEW: Pass mobile props
        onMobileToggle={setIsMobileSidebarOpen}  // NEW: Pass mobile props
         />

        <div className="explore-container">
          {/* 🔹 Menu / Explore Title Row */}
          <div className="flex items-center mb-4">
            <Image
              src="/setting.svg" // ✅ make sure image path is correct
              alt="Menu Icon"
              width={25} // Figma-like size (clean & aligned)
              height={25}
              className="object-contain mr-[4px] relative top-[1px]" // 👈 tight spacing & perfect vertical alignment
            />
            <h2
              className="font-[400] text-[14px] leading-[22px] text-[#707070]"
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