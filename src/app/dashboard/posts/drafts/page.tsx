"use client";
import { useState, useEffect } from "react"; 
import { useDebounce } from "@/hooks/useDebounce"; 
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import Image from "next/image";
import HeaderDraft from "@/components/layout/HeaderDraft";
import Sidebar from "@/components/layout/Sidebar";
import DraftGrid from "@/components/content/DraftGrid";
import "./PostDraftPage.css";

export default function PostDraftPage() {
  const router = useRouter();
  const { user, loading } = useAuth(); // ✅ check auth state

  // 🔐 Redirect if not authenticated
  useEffect(() => {
    if (!loading && !user) {
      router.push("/auth/login");
    }
  }, [user, loading, router]);

  const [searchQuery, setSearchQuery] = useState(""); 
  const [filters, setFilters] = useState<Record<string, string>>({ 
    status: "draft", 
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
    const updatedFilters = {
      ...newFilters,
      status: newFilters.status || "draft",
      q: debouncedSearchQuery
    };
    setFilters(updatedFilters);
  };

  // 🚫 Prevent rendering UI until auth check finishes
  if (loading || (!user && !loading)) return (
          <div className="dashboard">
            <Sidebar />
            <div className="main-content">
              <div style={{ padding: "20px", textAlign: "center" }}>Loading...</div>
            </div>
          </div>
        );;

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

        <div className="post-container">
          {/* 🔹 Menu / PostPage Title Row */}
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
              Post / Draft
            </h2>
          </div>

          {/* 🔹 Grid Section */}
          <DraftGrid type="post" searchQuery={searchQuery} filters={filters} />
        </div>
      </div>
    </div>
  );
}
