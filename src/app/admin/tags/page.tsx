"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import Image from "next/image";
import Header from "@/components/admin/Header";
import Sidebar from "@/components/admin/Sidebar";
import TagGrid from "@/components/admin/TagGrid";
import "./ExplorePage.css";
import { useAuthContext } from "@/hooks/AuthProvider";
import CategoryGridSkeleton from "@/components/admin/CategoryGridSkeleton";

export default function ExplorePage() {
  // 🔐 Auth & Redirect Logic
  const router = useRouter();
  const { user, loading,token, isAuthenticated } = useAuthContext();

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
        <Header collapsed={sidebarCollapsed}/>

        <div className="explore-container">
          {/* 🔹 Breadcrumb / Title */}
          <div className="flex items-center mb-4">
            <Image
              src="/tag.svg"
              alt="Menu Icon"
              width={25}
              height={25}
            />
            <h2 className="font-[400] text-[14px] leading-[22px] text-[#707070]">
              Tag/ Tag List
            </h2>
          </div>
             <div className="flex justify-center items-start mt-8">
                                  <CategoryGridSkeleton />
                                </div>
        </div>
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
              src="/tag.svg"
              alt="Menu Icon"
              width={25}
              height={25}
            />
            <h2 className="font-[400] text-[14px] leading-[22px] text-[#707070]">
              Tag/ Tag List
            </h2>
          </div>

          {/* 🔹 Category Grid */}
          <TagGrid />
        </div>
      </div>
    </div>
  );
}
