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
import NotificationsCardSkeleton from "@/components/content/NotificationsCardSkeleton";

export default function ExplorePage() {
  // 🔐 Auth & Redirect Logic
  const router = useRouter();
  const { user,token, loading, isAuthenticated,profileImage } = useAuthContext();
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false); // NEW: Separate state for mobile sidebar
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
         <Header 
                 collapsed={sidebarCollapsed}
                 isMobileOpen={isMobileSidebarOpen}  // NEW: Pass mobile props
                 onMobileToggle={setIsMobileSidebarOpen}  // NEW: Pass mobile props
                 profileImage={profileImage}
                  />
         <div className="explore-container">
           {/* 🔹 Page Title Row */}
           <div className="flex items-center mb-4">
             <Image
               src="/notfication.svg"
               alt="Menu Icon"
               width={25}
               height={25}
               className="object-contain mr-[4px] relative top-[1px]"
             />
             <h2
               className="font-[400] text-[14px] leading-[22px] text-[#707070]"
               style={{ fontFamily: "'Public Sans', sans-serif" }}
             >
               Update / Notifications
             </h2>
           </div>
 
           {/* 🔹 Skeleton Loading Grid */}
          <div
       className="flex flex-col items-center justify-start mx-auto"
       style={{
         width: "1200px",
         backgroundColor: "rgba(255,255,255,0.05)",
         borderRadius: "10px",
         border: "1px solid rgba(80,80,80,0.24)",
         boxShadow: "inset 0 0 7px rgba(255,255,255,0.16)",
         backdropFilter: "blur(12px)",
         overflow: "hidden",
       }}
     >
             <div className="w-[1190px] h-[56px] bg-white/[0.05] border border-[rgba(145,158,171,0.2)] rounded-xl flex items-center justify-between px-2 mb-1 mt-1 gap-2">
         {[{ label: "All" }, { label: "Unread" }, { label: "Archived" }].map(
           (item) => (
             <div
               key={item.label}
               className="flex-1 h-[40px] rounded-xl bg-white/[0.08] animate-pulse"
             />
           )
         )}
       </div>
             {[...Array(6)].map((_, i) => (
               <NotificationsCardSkeleton key={i} />
             ))}
           </div>
         </div>
       </div>
     </div>
   );
 }
 
       if (!token) return null; // ✅ Prevents unauthorized API call before redirect

  // ✅ Main content (once logged in)
  return (
    <div className="dashboard">
     <Sidebar 
                                            onToggle={(collapsed) => setSidebarCollapsed(collapsed)} 
                                            isMobileOpen={isMobileSidebarOpen}  // NEW: Pass mobile props
                                            onMobileToggle={setIsMobileSidebarOpen}  // NEW: Pass mobile props
                                          />
                 <div className={`main-content ${sidebarCollapsed ? "collapsed" : ""}`}>
                   <Header
                           collapsed={sidebarCollapsed}
                           isMobileOpen={isMobileSidebarOpen}  // NEW: Pass mobile props
                           onMobileToggle={setIsMobileSidebarOpen}  // NEW: Pass mobile props
                           profileImage={profileImage}
                            />

        <div className="explore-container">
          {/* 🔹 Breadcrumb / Title */}
          <div className="flex items-center mb-4">
            <Image
              src="/pillicon.png"
              alt="Menu Icon"
              width={25}
              height={25}
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
