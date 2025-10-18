"use client";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useState, useEffect } from "react";
import { useDebounce } from "@/hooks/useDebounce";
import Image from "next/image";
import Header from "@/components/layout/Header";
import Sidebar from "@/components/layout/Sidebar";
import ResearchGrid from "@/components/content/ResearchGrid";
import "./ResearchPage.css";

export default function ResearchPage() {
  // 🔐 Auth & Redirect Logic
  const router = useRouter();
  const { token, loading } = useAuth();

  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // ✅ Define all hooks BEFORE conditional rendering
  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState<Record<string, string>>({
    status: "",
    category: "",
  });

  const debouncedSearchQuery = useDebounce(searchQuery, 300);

  // 🔁 Update filters with debounced search query
  useEffect(() => {
    setFilters((prev) => ({ ...prev, q: debouncedSearchQuery }));
  }, [debouncedSearchQuery]);

  // 🔍 Handlers
  const handleSearchChange = (q: string) => setSearchQuery(q);
  const handleFiltersChange = (newFilters: Record<string, string>) => {
    setFilters((prev) => ({
      ...prev,
      ...newFilters,
      q: debouncedSearchQuery,
    }));
  };

  // 🚨 Redirect to login if not authenticated
  useEffect(() => {
    if (!loading && !token) {
      router.push("/auth/login");
    }
  }, [loading, token, router]);

  // 🛑 Prevent unauthorized render before redirect
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

  // ✅ Main Page Content
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

        <div className="Research-container">
          {/* 🔹 Menu / Research Title Row */}
          <div className="flex items-center mb-4">
            <Image
              src="/Reserchnew.png"
              alt="Menu Icon"
              width={20}
              height={20}
              className="object-contain mr-[4px] relative top-[1px]"
            />
            <h2
              className="font-[400] text-[14px] leading-[22px] text-[#707070]"
              style={{ fontFamily: "'Public Sans', sans-serif" }}
            >
              Research / Research List
            </h2>
          </div>

          {/* 🔹 Grid Section */}
          <ResearchGrid
            type="research"
            searchQuery={searchQuery}
            filters={filters}
          />
        </div>
      </div>
    </div>
  );
}
