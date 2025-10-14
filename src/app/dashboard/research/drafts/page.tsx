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

export default function ResearchDraftPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth(); // ✅ optional auth

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
                  <Sidebar />
                  <div className="main-content">
                    <p className="text-center text-gray-400 mt-10">Loading...</p>
                  </div>
                </div>
              );;

  // -----------------------------
  // Render
  // -----------------------------
  return (
    <div className="dashboard">
      <Sidebar />
      <div className="main-content">
        <HeaderDraft
          searchQuery={searchQuery}
          onSearchChange={handleSearchChange}
          filters={filters}
          onFiltersChange={handleFiltersChange}
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
              className="font-[400] text-[12px] leading-[22px] text-[#707070]"
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
