"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import Image from "next/image";
import Header from "@/components/admin/Header";
import Sidebar from "@/components/admin/Sidebar";
import SettingsPage from "@/components/admin/SettingsPage";
import "./ExplorePage.css";
import { useAuthContext } from "@/hooks/AuthProvider";
import SettingsPageSkeleton from "@/components/content/SettingsPageSkeleton";

export default function ExplorePage() {
  // 🔐 Auth & Redirect Logic
  const router = useRouter();
  const { user, loading, token, isAuthenticated } = useAuthContext();

  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [initialLoad, setInitialLoad] = useState(true); // NEW: Local loading state for skeleton on page load

  // Load sidebar state from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("sidebar-collapsed");
    if (saved === "true") setSidebarCollapsed(true);
  }, []);

  // NEW: Simulate initial load delay to show skeleton on every page visit
  useEffect(() => {
    const timer = setTimeout(() => setInitialLoad(false), 500); // Show skeleton for 500ms on load
    return () => clearTimeout(timer);
  }, []);

  // Redirect if not logged in
  useEffect(() => {
    if (!loading && !token) {
      router.push("/auth/login");
    }
  }, [loading, token, router]);

  // 🛑 While loading, no token, or initial load — show skeleton
  if (loading || !token || initialLoad) {
    return (
      <div className="dashboard">
        <Sidebar onToggle={setSidebarCollapsed} />
        <div className={`main-content ${sidebarCollapsed ? "collapsed" : ""}`}>
          <Header collapsed={sidebarCollapsed} />

          <div className="explore-container">
            {/* 🔹 Breadcrumb / Title */}
            <div className="flex items-center mb-4">
              <Image
                src="/setting.svg"
                alt="Menu Icon"
                width={25}
                height={25}
              />
              <h2 className="font-[400] text-[14px] leading-[22px] text-[#707070]">
                Update/ Settings
              </h2>
            </div>
          </div>
          <div className="flex justify-center items-start mt-8">
            <SettingsPageSkeleton />
          </div>
        </div>
      </div>
    );
  }

  // ✅ Main content (once logged in and initial load done)
  return (
    <div className="dashboard">
      <Sidebar onToggle={setSidebarCollapsed} />
      <div className={`main-content ${sidebarCollapsed ? "collapsed" : ""}`}>
        <Header collapsed={sidebarCollapsed} />

        <div className="explore-container">
          {/* 🔹 Breadcrumb / Title */}
          <div className="flex items-center mb-4">
            <Image
              src="/setting.svg"
              alt="Menu Icon"
              width={25}
              height={25}
            />
            <h2 className="font-[400] text-[14px] leading-[22px] text-[#707070]">
              Update/ Settings
            </h2>
          </div>

          {/* 🔹 Settings Page */}
          <SettingsPage />
        </div>
      </div>
    </div>
  );
}
