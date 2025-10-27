"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation"; // ✅ For redirect
import { useDebounce } from "@/hooks/useDebounce";
import Image from "next/image";
import Header from "@/components/layout/Header";
import Sidebar from "@/components/layout/Sidebar";
import ContentGrid1 from "@/components/content/ContentGrid1";
import "./PostPage.css";
import ContentCardSkeleton from "@/components/content/ContentCardSkeleton";
import { useAuthContext } from "@/hooks/AuthProvider";

export default function PostPage() {
  const router = useRouter();
  const { user, loading, isAuthenticated } = useAuthContext(); // ✅ check authentication state

  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false); // NEW: Separate state for mobile sidebar

  // 🔐 Redirect if not authenticated
  useEffect(() => {
    if (!loading && !user) {
      router.push("/auth/login");
    }
  }, [user, loading, router]);

  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState<Record<string, string>>({
    status: "",
    category: "",
  });

  const debouncedSearchQuery = useDebounce(searchQuery, 300);

  useEffect(() => {
    setFilters((prev) => ({ ...prev, q: debouncedSearchQuery }));
  }, [debouncedSearchQuery]);

  const handleSearchChange = (q: string) => {
    setSearchQuery(q);
  };

  const handleFiltersChange = (newFilters: Record<string, string>) => {
    setFilters((prev) => ({
      ...prev,
      ...newFilters,
      q: debouncedSearchQuery,
    }));
  };

  // 🚫 Prevent rendering UI until auth check finishes
 if (loading || !user) {
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
             searchQuery={searchQuery}
             onSearchChange={handleSearchChange}
             filters={filters}
             onFiltersChange={handleFiltersChange}
            isMobileOpen={isMobileSidebarOpen}  // NEW: Pass mobile props
            onMobileToggle={setIsMobileSidebarOpen}  // NEW: Pass mobile props
           />
           <div className="explore-container">
             <div className="flex items-center mb-4">
               <Image
                 src="/post.svg"
                 alt="Menu Icon"
                 width={25}
                 height={25}
                 className="object-contain mr-[4px] relative top-[1px]"
               />
               <h2
                 className="font-[400] text-[14px] leading-[22px] text-[#707070]"
                 style={{ fontFamily: "'Public Sans', sans-serif" }}
               >
                 Post / Post List
               </h2>
             </div>
   
             {/* Skeleton grid */}
             <div
               className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-[2px] gap-y-[-10px] place-items-center"
               style={{ width: "100%", maxWidth: "1429px", margin: "0 auto", overflowX: "hidden", boxSizing: "border-box" }}
             >
               {Array(8).fill(0).map((_, i) => (
                 <div key={i} style={{ width: "310px", transform: "scale(0.9)", transformOrigin: "top center" }}>
                   <ContentCardSkeleton />
                 </div>
               ))}
             </div>
           </div>
         </div>
       </div>
     );
   }

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
                        searchQuery={searchQuery}
                        onSearchChange={handleSearchChange}
                        filters={filters}
                        onFiltersChange={handleFiltersChange}
                        isMobileOpen={isMobileSidebarOpen}  // NEW: Pass mobile props
                        onMobileToggle={setIsMobileSidebarOpen}  // NEW: Pass mobile props
                      />

        <div className="post-container">
          {/* 🔹 Menu / PostPage Title Row */}
          <div className="flex items-center mb-4">
            <Image
              src="/post.svg"
              alt="Menu Icon"
              width={25}
              height={25}
              className="object-contain mr-[4px] relative top-[1px]"
            />
            <h2
              className="font-[400] text-[14px] leading-[22px] text-[#707070]"
              style={{ fontFamily: "'Public Sans', sans-serif" }}
            >
              Post / Post List
            </h2>
          </div>

          {/* 🔹 Grid Section */}
          <ContentGrid1 type="post" searchQuery={searchQuery} filters={filters} />
        </div>
      </div>
    </div>
  );
}
