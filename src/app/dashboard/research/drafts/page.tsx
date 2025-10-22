"use client";
import { useState, useEffect } from "react";
import { useDebounce } from "@/hooks/useDebounce";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import Image from "next/image";
import HeaderDraft from "@/components/layout/HeaderDraft";
import Sidebar from "@/components/layout/Sidebar";
import DraftGrid from "@/components/content/DraftGrid";
import "./researchDraftPage.css";
import DraftCardSkeleton from "@/components/content/DraftCardSkeleton";

export default function ResearchDraftPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth(); // ✅ optional auth
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // -----------------------------
  // States
  // -----------------------------
  const [searchQuery, setSearchQuery] = useState(""); // Raw search input
  const [filters, setFilters] = useState<Record<string, string>>({
    status: "draft", // Always default to draft
    category: "",
  });

  const debouncedSearchQuery = useDebounce(searchQuery, 300);

  useEffect(() => {
    setFilters((prev) => ({ ...prev, q: debouncedSearchQuery }));
  }, [debouncedSearchQuery]);

  const handleSearchChange = (q: string) => setSearchQuery(q);

  const handleFiltersChange = (newFilters: Record<string, string>) => {
    const updatedFilters = {
      ...newFilters,
      status: newFilters.status || "draft", // Always ensure draft if not specified
      q: debouncedSearchQuery,
    };
    setFilters(updatedFilters);
  };

  // -----------------------------
  // Redirect if not authenticated (optional)
  // -----------------------------
  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/auth/login");
    }
  }, [user, authLoading, router]);

  // -----------------------------
  // Conditional render until auth finishes
  // -----------------------------
  if (authLoading || (!user && !authLoading)) return (
        <div className="dashboard">
          <Sidebar onToggle={(collapsed) => setSidebarCollapsed(collapsed)} />
          <div className={`main-content ${sidebarCollapsed ? "collapsed" : ""}`}>
            <HeaderDraft
              searchQuery={searchQuery}
              onSearchChange={handleSearchChange}
              filters={filters}
              onFiltersChange={handleFiltersChange}
              collapsed={sidebarCollapsed}
            />
    
            {/* Mindmap / Draft header */}
            <div className="mindmap-container mb-6">
              <div className="flex items-center">
                <Image
                  src="/draft.svg"
                  alt="Mindmap Icon"
                  width={20}
                  height={20}
                  className="object-contain mr-[4px] relative top-[1px]"
                />
                <h2
                  className="font-[400] text-[14px] leading-[22px] text-[#707070]"
                  style={{ fontFamily: "'Public Sans', sans-serif" }}
                >
                  Research / Draft
                </h2>
              </div>
            </div>
    
            {/* Grid of draft skeletons */}
            <div
              className="
                grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4
                gap-x-[2px] gap-y-[-10px]
                place-items-center mt-4
              "
              style={{
                width: "100%",
                maxWidth: "1429px",
                margin: "0 auto",
                overflowX: "hidden",
                boxSizing: "border-box",
              }}
            >
              {Array(8)
                .fill(0)
                .map((_, i) => (
                  <div
                    key={i}
                    style={{
                      width: "310px",
                      transform: "scale(0.9)",
                      transformOrigin: "top center",
                    }}
                  >
                    <DraftCardSkeleton />
                  </div>
                ))}
            </div>
          </div>
        </div>
      );
              
  // -----------------------------
  // Render
  // -----------------------------
  return (
    <div className="dashboard">
      <Sidebar onToggle={(collapsed) => setSidebarCollapsed(collapsed)} />
                  <div className={`main-content ${sidebarCollapsed ? "collapsed" : ""}`}>
                    <HeaderDraft
                      searchQuery={searchQuery}
                      onSearchChange={handleSearchChange}
                      filters={filters}
                      onFiltersChange={handleFiltersChange}
                      collapsed={sidebarCollapsed}
                    />

        <div className="research-container">
          {/* 🔹 Menu / research Title Row */}
          <div className="flex items-center mb-4">
            <Image
              src="/draft.svg"
              alt="Menu Icon"
              width={20}
              height={20}
              className="object-contain mr-[4px] relative top-[1px]"
            />
            <h2
              className="font-[400] text-[14px] leading-[22px] text-[#707070]"
              style={{ fontFamily: "'Public Sans', sans-serif" }}
            >
              Research / Draft
            </h2>
          </div>

          {/* 🔹 Grid Section */}
          <DraftGrid type="research" searchQuery={searchQuery} filters={filters} />
        </div>
      </div>
    </div>
  );
}
