"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation"; // ✅ For redirect
import { useDebounce } from "@/hooks/useDebounce";
import Image from "next/image";
import HeaderDraft from "@/components/layout/HeaderDraft";
import Sidebar from "@/components/layout/Sidebar";
import DraftGrid from "@/components/content/DraftGrid";
import "./MindmapDraftPage.css";
import DraftCardSkeleton from "@/components/content/DraftCardSkeleton";
import { useAuthContext } from "@/hooks/AuthProvider";

export default function MindmapDraftPage() {
  const router = useRouter();
  const { user, loading, isAuthenticated } = useAuthContext(); // ✅ check auth state
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false); // NEW: Separate state for mobile sidebar

  // 🔐 Redirect if not authenticated
  // 🔐 Redirect if not authenticated
   useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push("/auth/login");
    }
  }, [loading, isAuthenticated, router]);

  const [searchQuery, setSearchQuery] = useState(""); // Raw search input

  // ✅ Default filters: always draft
  const [filters, setFilters] = useState<Record<string, string>>({
    status: "draft",
    category: "",
  });

  // ✅ Debounced search for better performance
  const debouncedSearchQuery = useDebounce(searchQuery, 300);

  // ✅ Update filters when debounced value changes
  useEffect(() => {
    setFilters((prev) => ({ ...prev, q: debouncedSearchQuery }));
  }, [debouncedSearchQuery]);

  // ✅ Handlers
  const handleSearchChange = (q: string) => {
    setSearchQuery(q);
  };

  const handleFiltersChange = (newFilters: Record<string, string>) => {
    setFilters({
      ...newFilters,
      status: newFilters.status || "draft", // Always draft by default
      q: debouncedSearchQuery,
    });
  };

  // 🚫 Prevent rendering UI until auth finishes
  if (loading || !user) 
  return (
    <div className="dashboard">
      <Sidebar 
                      onToggle={(collapsed) => setSidebarCollapsed(collapsed)} 
                      isMobileOpen={isMobileSidebarOpen}  // NEW: Pass mobile props
                      onMobileToggle={setIsMobileSidebarOpen}  // NEW: Pass mobile props
                    />
      <div className={`main-content ${sidebarCollapsed ? "collapsed" : ""}`}>
        <HeaderDraft
          searchQuery={searchQuery}
          onSearchChange={handleSearchChange}
          filters={filters}
          onFiltersChange={handleFiltersChange}
          collapsed={sidebarCollapsed}
          isMobileOpen={isMobileSidebarOpen}  // NEW: Pass mobile props
          onMobileToggle={setIsMobileSidebarOpen}  // NEW: Pass mobile props
        />

        {/* Mindmap / Draft header */}
        <div className="mindmap-container mb-6">
          <div className="flex items-center">
            <Image
              src="/draft.svg"
              alt="Mindmap Icon"
              width={25}
              height={25}
              className="object-contain mr-[4px] relative top-[1px]"
            />
            <h2
              className="font-[400] text-[14px] leading-[22px] text-[#707070]"
              style={{ fontFamily: "'Public Sans', sans-serif" }}
            >
              Mind Map / Draft
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



  return (
    <div className="dashboard">
      <Sidebar 
                      onToggle={(collapsed) => setSidebarCollapsed(collapsed)} 
                      isMobileOpen={isMobileSidebarOpen}  // NEW: Pass mobile props
                      onMobileToggle={setIsMobileSidebarOpen}  // NEW: Pass mobile props
                    />
      <div className={`main-content ${sidebarCollapsed ? "collapsed" : ""}`}>
        <HeaderDraft
          searchQuery={searchQuery}
          onSearchChange={handleSearchChange}
          filters={filters}
          onFiltersChange={handleFiltersChange}
          collapsed={sidebarCollapsed}
          isMobileOpen={isMobileSidebarOpen}  // NEW: Pass mobile props
          onMobileToggle={setIsMobileSidebarOpen}  // NEW: Pass mobile props
        />

        <div className="mindmap-container">
          {/* 🔹 Menu / Mindmap Title Row */}
          <div className="flex items-center mb-4">
            <Image
              src="/draft.svg" // ✅ you can use SVG here just like PNG
              alt="Mindmap Icon"
              width={25}
              height={25}
              className="object-contain mr-[4px] relative top-[1px]"
            />
            <h2
              className="font-[400] text-[14px] leading-[22px] text-[#707070]"
              style={{ fontFamily: "'Public Sans', sans-serif" }}
            >
              Mind Map / Draft
            </h2>
          </div>

          {/* 🔹 Grid Section */}
          <DraftGrid type="mindmap" searchQuery={searchQuery} filters={filters} />
        </div>
      </div>
    </div>
  );
}
