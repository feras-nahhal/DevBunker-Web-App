"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation"; // ✅ For redirect
import { useAuth } from "@/hooks/useAuth"; // ✅ Auth context
import { useDebounce } from "@/hooks/useDebounce";
import Image from "next/image";
import HeaderDraft from "@/components/layout/HeaderDraft";
import Sidebar from "@/components/layout/Sidebar";
import DraftGrid from "@/components/content/DraftGrid";
import "./MindmapDraftPage.css";

export default function MindmapDraftPage() {
  const router = useRouter();
  const { user, loading } = useAuth(); // ✅ Check auth state
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // 🔐 Redirect if not authenticated
  useEffect(() => {
    if (!loading && !user) {
      router.push("/auth/login");
    }
  }, [user, loading, router]);

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
  if (loading || (!user && !loading)) return (
                <div className="dashboard">
                  <Sidebar onToggle={(collapsed) => setSidebarCollapsed(collapsed)} />
                        <div className={`main-content ${sidebarCollapsed ? "collapsed" : ""}`}>
                          <p className="text-center text-gray-400 mt-10">Loading...</p>
                        </div>
                      </div>
              );;

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

        <div className="mindmap-container">
          {/* 🔹 Menu / Mindmap Title Row */}
          <div className="flex items-center mb-4">
            <Image
              src="/draft.svg" // ✅ you can use SVG here just like PNG
              alt="Mindmap Icon"
              width={20}
              height={20}
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
