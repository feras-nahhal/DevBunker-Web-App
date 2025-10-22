"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import Image from "next/image";
import Header from "@/components/admin/Header";
import Sidebar from "@/components/admin/Sidebar";
import NotificationsGrid from "@/components/admin/NotificationsGrid";
import "./ExplorePage.css";
import { useAuthContext } from "@/hooks/AuthProvider";

export default function ExplorePage() {
  // 🔐 Auth & Redirect Logic
  const router = useRouter();
  const { user,token, loading, isAuthenticated } = useAuthContext();

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
        <Header collapsed={sidebarCollapsed} />

        <div className="explore-container">
          {/* 🔹 Breadcrumb / Title */}
          <div className="flex items-center mb-4">
            <Image
              src="/pillicon.png"
              alt="Menu Icon"
              width={20}
              height={20}
            />
            <h2 className="font-[400] text-[14px] leading-[22px] text-[#707070]">
              Update/ Notifications
            </h2>
          </div>

          {/* 🔹 Category Grid */}
          <NotificationsGrid />
        </div>
      </div>
    </div>
  );
}
