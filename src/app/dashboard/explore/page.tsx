"use client";
import { useRouter, useSearchParams } from "next/navigation";  // Add useSearchParams
import { useAuth } from "@/hooks/useAuth";
import { useState, useEffect } from "react";
import { useDebounce } from "@/hooks/useDebounce";
import Image from "next/image";
import Header from "@/components/layout/Header";
import Sidebar from "@/components/layout/Sidebar";
import ContentGrid from "@/components/content/ContentGrid";
import "./ExplorePage.css";

export default function ExplorePage() {
  const router = useRouter();
  const searchParams = useSearchParams();  // Get query params
  const { token, loading } = useAuth();

  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
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

  useEffect(() => {
    if (!loading && !token) {
      router.push("/auth/login");
      return;
    }
  }, [loading, token, router]);

  // NEW: Handle share link (open popup if ID in URL)
  useEffect(() => {
    const id = searchParams.get("id");
    if (id) {
      // Pass the ID to ContentGrid to open the popup
      // We'll add a prop to ContentGrid for this
      setSelectedContentId(id);
    }
  }, [searchParams]);

  const [selectedContentId, setSelectedContentId] = useState<string | null>(null);

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
              src="/explorelogo.png"
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
            selectedContentId={selectedContentId}  // NEW: Pass ID to open popup
          />
        </div>
      </div>
    </div>
  );
}