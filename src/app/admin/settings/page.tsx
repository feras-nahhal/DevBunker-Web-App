"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import Image from "next/image";
import Header from "@/components/admin/Header";
import Sidebar from "@/components/admin/Sidebar";
import SettingsPage from "@/components/admin/SettingsPage";
import "./ExplorePage.css";

export default function ExplorePage() {
  // 🔐 Auth & Redirect Logic
  const router = useRouter();
  const { token, loading } = useAuth();

  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Load sidebar state from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("sidebar-collapsed");
    if (saved === "true") setSidebarCollapsed(true);
  }, []);

  // Redirect if not logged in
  useEffect(() => {
    if (!loading && !token) {
      router.push("/auth/login");
    }
  }, [loading, token, router]);

  // 🛑 While loading or no token — show loader
  if (loading || !token) {
    return (
      <div className="dashboard">
        <Sidebar onToggle={setSidebarCollapsed} />
        <div className={`main-content ${sidebarCollapsed ? "collapsed" : ""}`}>
          <p className="text-center text-gray-400 mt-10">Loading...</p>
        </div>
      </div>
    );
  }

  // ✅ Main content (once logged in)
  return (
    <div className="dashboard">
      <Sidebar onToggle={setSidebarCollapsed} />
      <div className={`main-content ${sidebarCollapsed ? "collapsed" : ""}`}>
        <Header collapsed={sidebarCollapsed}/>

        <div className="explore-container">
          {/* 🔹 Breadcrumb / Title */}
          <div className="flex items-center mb-4">
            <Image
              src="/setting.svg"
              alt="Menu Icon"
              width={20}
              height={20}
            />
            <h2 className="font-[400] text-[14px] leading-[22px] text-[#707070]">
              Menu/ Settings
            </h2>
          </div>

          {/* 🔹 Category Grid */}
          <SettingsPage />
        </div>
      </div>
    </div>
  );
}
