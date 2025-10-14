"use client";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useState, useEffect } from "react";
import { useDebounce } from "@/hooks/useDebounce";
import Image from "next/image";
import Header from "@/components/layout/Header";
import Sidebar from "@/components/layout/Sidebar";
import ReadLaterGrid from "@/components/content/ReadLaterGrid";
import "./ExplorePage.css";

export default function ReadLaterPage() {
  // 🔐 Auth
  const router = useRouter();
  const { token, loading } = useAuth();

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
        <Sidebar />
        <div className="main-content">
          <p className="text-center text-gray-400 mt-10">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard">
      <Sidebar />
      <div className="main-content">
        <Header
          searchQuery={searchQuery}
          onSearchChange={handleSearchChange}
          filters={filters}
          onFiltersChange={handleFiltersChange}
        />

        <div className="explore-container">
          {/* 🔹 Menu / Read Later Title Row */}
          <div className="flex items-center mb-4">
            <Image
              src="/readlaterlogo.png"
              alt="Menu Icon"
              width={20}
              height={20}
              className="object-contain mr-[4px] relative top-[1px]"
            />
            <h2
              className="font-[400] text-[12px] leading-[22px] text-[#707070]"
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
