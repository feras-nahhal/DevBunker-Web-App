"use client";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth"
import { useEffect,useState } from "react";
import Image from "next/image";
import HeaderOther from "@/components/layout/HeaderOther";
import Sidebar from "@/components/layout/Sidebar";
import "./ExplorePage.css";
import SettingsPage from "@/components/content/SettingsPage";

export default function ExplorePage() {
  // 🔐 Auth & Redirect Logic
        const router = useRouter();
        const { token, loading } = useAuth();
        const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
      
        useEffect(() => {
          if (!loading && !token) {
            router.push("/auth/login");
          }
        }, [loading, token, router]);
      
        // 🛑 Don’t render CategoryGrid until we know user is logged in
        if (loading || !token) {
            return (
              <div className="dashboard">
                      <Sidebar onToggle={(collapsed) => setSidebarCollapsed(collapsed)} />
                      <div className={`main-content ${sidebarCollapsed ? "collapsed" : ""}`}>
                        <p className="text-center text-gray-400 mt-10">Loading...</p>
                      </div>
                    </div>
            );
          }
        if (!token) return null; // ✅ Prevents unauthorized API call before redirect
  
  return (
    <div className="dashboard">
      <Sidebar onToggle={(collapsed) => setSidebarCollapsed(collapsed)} />
        <div className={`main-content ${sidebarCollapsed ? "collapsed" : ""}`}>
        <HeaderOther collapsed={sidebarCollapsed} />

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
