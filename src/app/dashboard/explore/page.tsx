"use client";

import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useState, useEffect } from "react";
import { useDebounce } from "@/hooks/useDebounce";
import Image from "next/image";
import Header from "@/components/layout/Header";
import Sidebar from "@/components/layout/Sidebar";
import ContentGrid from "@/components/content/ContentGrid";
import "./ExplorePage.css";
import ContentCardSkeleton from "@/components/content/ContentCardSkeleton";

export default function ExplorePage() {
  const router = useRouter();
  const { token, loading } = useAuth();

  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState<Record<string, string>>({
    status: "",
    category: "",
  });

  const [selectedContentId, setSelectedContentId] = useState<string | null>(null); // ✅ Moved above useEffect

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

  useEffect(() => {
    if (!loading && !token) {
      router.push("/auth/login");
      return;
    }
  }, [loading, token, router]);

  // ✅ Get query parameter manually from window.location
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      setSelectedContentId(params.get("id"));
    }
  }, []);

  if (loading || !token) {
  return (
    <div className="dashboard">
      <Sidebar onToggle={(collapsed) => setSidebarCollapsed(collapsed)} />
      <div className={`main-content ${sidebarCollapsed ? "collapsed" : ""}`}>
        <Header
          collapsed={sidebarCollapsed}
          searchQuery={searchQuery}
          onSearchChange={handleSearchChange}
          filters={filters}
          onFiltersChange={handleFiltersChange}
        />
        <div className="explore-container">
          <div className="flex items-center mb-4">
            <Image
              src="/explore.svg"
              alt="Menu Icon"
              width={20}
              height={20}
              className="object-contain mr-[4px] relative top-[1px]"
            />
            <h2
              className="font-[400] text-[14px] leading-[22px] text-[#707070]"
              style={{ fontFamily: "'Public Sans', sans-serif" }}
            >
              Menu / Explore
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
      <Sidebar onToggle={(collapsed) => setSidebarCollapsed(collapsed)} />
      <div className={`main-content ${sidebarCollapsed ? "collapsed" : ""}`}>
        <Header
          collapsed={sidebarCollapsed}
          searchQuery={searchQuery}
          onSearchChange={handleSearchChange}
          filters={filters}
          onFiltersChange={handleFiltersChange}
        />

        <div className="explore-container">
          <div className="flex items-center mb-4">
            <Image
              src="/explore.svg"
              alt="Menu Icon"
              width={20}
              height={20}
              className="object-contain mr-[4px] relative top-[1px]"
            />
            <h2
              className="font-[400] text-[14px] leading-[22px] text-[#707070]"
              style={{ fontFamily: "'Public Sans', sans-serif" }}
            >
              Menu / Explore
            </h2>
          </div>

          <ContentGrid
            type="all"
            searchQuery={searchQuery}
            filters={filters}
            selectedContentId={selectedContentId} // ✅ Pass ID to open popup
          />
        </div>
      </div>
    </div>
  );
}
