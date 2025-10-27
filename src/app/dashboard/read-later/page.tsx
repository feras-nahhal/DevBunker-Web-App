"use client";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { useDebounce } from "@/hooks/useDebounce";
import Image from "next/image";
import Header from "@/components/layout/Header";
import Sidebar from "@/components/layout/Sidebar";
import ReadLaterGrid from "@/components/content/ReadLaterGrid";
import "./ExplorePage.css";
import ContentCardSkeleton from "@/components/content/ContentCardSkeleton";
import { useAuthContext } from "@/hooks/AuthProvider";

export default function ReadLaterPage() {
  // 🔐 Auth
  const router = useRouter();
  const { token, loading, isAuthenticated } = useAuthContext(); // ✅ check authentication state

  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false); // NEW: Separate state for mobile sidebar
  // ✅ All hooks must always run before any conditional return
  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState<Record<string, string>>({
    status: "",
    category: "",
  });

  const debouncedSearchQuery = useDebounce(searchQuery, 300);

  useEffect(() => {
    setFilters((prev) => ({ ...prev, q: debouncedSearchQuery }));
  }, [debouncedSearchQuery]);

  const handleSearchChange = (q: string) => setSearchQuery(q);

  const handleFiltersChange = (newFilters: Record<string, string>) => {
    setFilters((prev) => ({
      ...prev,
      ...newFilters,
      q: debouncedSearchQuery,
    }));
  };

  // ✅ Redirect logic AFTER hooks
  useEffect(() => {
    if (!loading && !token) {
      router.push("/auth/login");
    }
  }, [loading, token, router]);

  // ✅ Conditional rendering — safe, hooks already declared
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
                src="/readlater.svg"
                alt="Menu Icon"
                width={25}
                height={25}
                className="object-contain mr-[4px] relative top-[1px]"
              />
              <h2
                className="font-[400] text-[14px] leading-[22px] text-[#707070]"
                style={{ fontFamily: "'Public Sans', sans-serif" }}
              >
                Menu / Read Later
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

        <div className="explore-container">
          {/* 🔹 Menu / Read Later Title Row */}
          <div className="flex items-center mb-4">
            <Image
              src="/readlater.svg"
              alt="Menu Icon"
              width={25}
              height={25}
              className="object-contain mr-[4px] relative top-[1px]"
            />
            <h2
              className="font-[400] text-[14px] leading-[22px] text-[#707070]"
              style={{ fontFamily: "'Public Sans', sans-serif" }}
            >
              Menu / Read Later
            </h2>
          </div>

          {/* 🔹 Read Later Grid */}
          <ReadLaterGrid searchQuery={searchQuery} filters={filters} />
        </div>
      </div>
    </div>
  );
}
