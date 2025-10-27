"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { useDebounce } from "@/hooks/useDebounce";
import Image from "next/image";

import { useAuthContext } from "@/hooks/AuthProvider";
import Header from "@/components/layout/Header";
import Sidebar from "@/components/layout/Sidebar";
import ContentGrid from "@/components/content/ContentGrid";
import ContentCardSkeleton from "@/components/content/ContentCardSkeleton";

import "./ExplorePage.css";

export default function ExplorePage() {
  const router = useRouter();
  const { user, loading, isAuthenticated } = useAuthContext();

  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false); // NEW: Separate state for mobile sidebar
  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState<Record<string, string>>({
    status: "",
    category: "",
  });
  const [selectedContentId, setSelectedContentId] = useState<string | null>(null);

  const debouncedSearchQuery = useDebounce(searchQuery, 300);

  // Update filters when debounced search changes
  useEffect(() => {
    setFilters((prev) => ({ ...prev, q: debouncedSearchQuery }));
  }, [debouncedSearchQuery]);

  const handleSearchChange = (q: string) => setSearchQuery(q);
  const handleFiltersChange = (newFilters: Record<string, string>) => {
    setFilters((prev) => ({ ...prev, ...newFilters, q: debouncedSearchQuery }));
  };

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push("/auth/login");
    }
  }, [loading, isAuthenticated, router]);

  // Read "id" query param to open popup
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      setSelectedContentId(params.get("id"));
    }
  }, []);

  // Skeleton while loading
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
                src="/bookmark.svg"
                alt="Explore Icon"
                width={25}
                height={25}
                className="object-contain mr-1 relative top-[1px]"
              />
              <h2 className="font-[400] text-[14px] leading-[22px] text-[#707070]">
                Discover / Bookmark
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 place-items-center">
              {Array(8).fill(0).map((_, i) => (
                <div key={i} className="w-[310px] scale-90 origin-top">
                  <ContentCardSkeleton />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Main content
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
              src="/bookmark.svg"
              alt="Explore Icon"
              width={25}
              height={25}
              className="object-contain mr-1 relative top-[1px]"
            />
            <h2 className="font-[400] text-[14px] leading-[22px] text-[#707070]">
              Discover / Bookmark
            </h2>
          </div>

          <ContentGrid
            type="all"
            searchQuery={searchQuery}
            filters={filters}
            selectedContentId={selectedContentId}
          />
        </div>
      </div>
    </div>
  );
}
