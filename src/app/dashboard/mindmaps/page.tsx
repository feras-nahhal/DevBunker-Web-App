"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation"; // ✅ For redirect
import { useAuth } from "@/hooks/useAuth"; // ✅ For auth context
import { useDebounce } from "@/hooks/useDebounce";
import Image from "next/image";
import Header from "@/components/layout/Header";
import Sidebar from "@/components/layout/Sidebar";
import "./MindmapPage.css";
import ContentGrid1 from "@/components/content/ContentGrid1";

export default function MindmapPage() {
  const router = useRouter();
  const { user, loading } = useAuth(); // ✅ check auth state

  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

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
  if (loading || (!user && !loading)) return(
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
        <Header
                  collapsed={sidebarCollapsed}
                  searchQuery={searchQuery}
                  onSearchChange={handleSearchChange}
                  filters={filters}
                  onFiltersChange={handleFiltersChange}
                />

        <div className="mindmap-container">
          {/* 🔹 Menu / Mindmap Title Row */}
          <div className="flex items-center mb-4">
            <Image
              src="/mindmap.png"
              alt="Menu Icon"
              width={20}
              height={20}
              className="object-contain mr-[4px] relative top-[1px]"
            />
            <h2
              className="font-[400] text-[14px] leading-[22px] text-[#707070]"
              style={{ fontFamily: "'Public Sans', sans-serif" }}
            >
              Mind Map / Mind Map List
            </h2>
          </div>

          {/* 🔹 Grid Section */}
          <ContentGrid1
            type="mindmap"
            searchQuery={searchQuery}
            filters={filters}
          />
        </div>
      </div>
    </div>
  );
}
