"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation"; // ✅ For redirect
import { useDebounce } from "@/hooks/useDebounce";
import Image from "next/image";
import Header from "@/components/layout/Header";
import Sidebar from "@/components/layout/Sidebar";
import "./MindmapPage.css";
import ContentGrid1 from "@/components/content/ContentGrid1";
import ContentCardSkeleton from "@/components/content/ContentCardSkeleton";
import { useAuthContext } from "@/hooks/AuthProvider";
import { CONTENT_STATUS } from "@/lib/enums";

export default function MindmapPage() {
  const router = useRouter();
  const { user, loading, isAuthenticated } = useAuthContext(); // ✅ check auth state

  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false); // NEW: Separate state for mobile sidebar

  // 🔐 Redirect if not authenticated
   useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push("/auth/login");
    }
  }, [loading, isAuthenticated, router]);

  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState<Record<string, string>>({
    status: "",
    category: "",
    tag: "",
    author_email: "",
    created_after: "",
    created_before: "",
    updated_after: "",
    updated_before: "",
    type: "all",
  });

  const [isFilterMenuOpen, setIsFilterMenuOpen] = useState(false);
  const filterMenuRef = useRef<HTMLDivElement>(null);

  // States for fetched data
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);
  const [tags, setTags] = useState<{ id: string; name: string }[]>([]);

  // States for dropdown open/close
  const [selectedContentId, setSelectedContentId] = useState<string | null>(null);
  const [statusDropdownOpen, setStatusDropdownOpen] = useState(false);
  const [categoryDropdownOpen, setCategoryDropdownOpen] = useState(false);
  const [tagDropdownOpen, setTagDropdownOpen] = useState(false);
  const [typeDropdownOpen, setTypeDropdownOpen] = useState(false);
  const debouncedSearchQuery = useDebounce(searchQuery, 300);

  
  // Fetch categories and tags on mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [catRes, tagRes] = await Promise.all([
          fetch("/api/categories"),
          fetch("/api/tags"),
        ]);
        const catData = await catRes.json();
        const tagData = await tagRes.json();
        if (catData.categories) setCategories(catData.categories);
        if (tagData.tags) setTags(tagData.tags);
      } catch (error) {
        console.error("Error fetching categories/tags:", error);
      }
    };
    fetchData();
  }, []);

  
  // Handlers for each filter change
  const handleStatusChange = (value: string) => {
    setFilters((prev) => ({ ...prev, status: value }));
  };
  const handleCategoryChange = (value: string) => {
    setFilters((prev) => ({ ...prev, category: value }));
  };
  const handleTagChange = (value: string) => {
    setFilters((prev) => ({ ...prev, tag: value }));
  };
  const handleTypeChange = (value: string) => {
    setFilters((prev) => ({ ...prev, type: value }));
  };
  const handleAuthorEmailChange = (value: string) => {
    setFilters((prev) => ({ ...prev, author_email: value }));
  };
  const handleCreatedAfterChange = (value: string) => {
    setFilters((prev) => ({ ...prev, created_after: value }));
  };
  const handleCreatedBeforeChange = (value: string) => {
    setFilters((prev) => ({ ...prev, created_before: value }));
  };
  const handleUpdatedAfterChange = (value: string) => {
    setFilters((prev) => ({ ...prev, updated_after: value }));
  };
  const handleUpdatedBeforeChange = (value: string) => {
    setFilters((prev) => ({ ...prev, updated_before: value }));
  };

  // Handle filter menu submission
  const handleFilterSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    // Close all dropdowns and menu
    setStatusDropdownOpen(false);
    setCategoryDropdownOpen(false);
    setTagDropdownOpen(false);
    setTypeDropdownOpen(false);
    setIsFilterMenuOpen(false);
  };

  // Reset all filters
  const handleResetFilters = () => {
    setFilters({
      status: "",
      category: "",
      tag: "",
      author_email: "",
      created_after: "",
      created_before: "",
      updated_after: "",
      updated_before: "",
      type: "all",
      q: debouncedSearchQuery,
    });
    setStatusDropdownOpen(false);
    setCategoryDropdownOpen(false);
    setTagDropdownOpen(false);
    setTypeDropdownOpen(false);
    setIsFilterMenuOpen(false);
  };

  // Close menu on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (filterMenuRef.current && !filterMenuRef.current.contains(event.target as Node)) {
        setIsFilterMenuOpen(false);
        setStatusDropdownOpen(false);
        setCategoryDropdownOpen(false);
        setTagDropdownOpen(false);
        setTypeDropdownOpen(false);
      }
    };
    if (isFilterMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isFilterMenuOpen]);

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

   // Read "id" query parameter for opening content popup
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      setSelectedContentId(params.get("id"));
    }
  }, []);

  // 🚫 Prevent rendering UI until auth check finishes
  if (loading || !user) {
    return (
      <div className="dashboard">
        <Sidebar 
                  onToggle={(collapsed) => setSidebarCollapsed(collapsed)} 
                  isMobileOpen={isMobileSidebarOpen}  // NEW: Pass mobile props
                  onMobileToggle={setIsMobileSidebarOpen}  // NEW: Pass mobile props
                />
        <div className={`main-content ${sidebarCollapsed ? "collapsed" : ""}`}>
          <Header
            collapsed={sidebarCollapsed}
            searchQuery={searchQuery}
            onSearchChange={handleSearchChange}
            filters={filters}
            onFiltersChange={handleFiltersChange}
            isMobileOpen={isMobileSidebarOpen}  // NEW: Pass mobile props
            onMobileToggle={setIsMobileSidebarOpen}  // NEW: Pass mobile props
          />
          <div className="explore-container">
            <div className="flex items-center mb-4">
              <Image
                src="/mindmap.svg"
                alt="Menu Icon"
                width={25}
                height={25}
                className="object-contain mr-[4px] relative top-[1px]"
              />
              <h2
                className="font-[400] text-[14px] leading-[22px] text-[#707070]"
                style={{ fontFamily: "'Public Sans', sans-serif" }}
              >
                Mind Map / Mind Map List
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
      <Sidebar 
                onToggle={(collapsed) => setSidebarCollapsed(collapsed)} 
                isMobileOpen={isMobileSidebarOpen}  // NEW: Pass mobile props
                onMobileToggle={setIsMobileSidebarOpen}  // NEW: Pass mobile props
              />
        <div className={`main-content ${sidebarCollapsed ? "collapsed" : ""}`}>
        <Header
                  collapsed={sidebarCollapsed}
                  searchQuery={searchQuery}
                  onSearchChange={handleSearchChange}
                  filters={filters}
                  onFiltersChange={handleFiltersChange}
                  isMobileOpen={isMobileSidebarOpen}  // NEW: Pass mobile props
                  onMobileToggle={setIsMobileSidebarOpen}  // NEW: Pass mobile props
                />

        <div className="mindmap-container">
          {/* 🔹 Menu / Mindmap Title Row */}
          <div className="flex items-center mb-4 relative">
            <Image
              src="/mindmap.svg"
              alt="Menu Icon"
              width={25}
              height={25}
              className="object-contain mr-[4px] relative top-[1px]"
            />
            <h2
              className="font-[400] text-[14px] leading-[22px] text-[#707070]"
              style={{ fontFamily: "'Public Sans', sans-serif" }}
            >
              Mind Map / Mind Map List
            </h2>
             {/* Filter Button on the Right */}
                        <button
                          onClick={() => setIsFilterMenuOpen(!isFilterMenuOpen)}
                          className="ml-auto flex items-center justify-center w-8 h-8 rounded-full bg-transparent hover:bg-gray-700 transition-colors"
                         
                        >
                          <Image
                            src="/filter1.svg"
                            alt="Filter Icon"
                            width={20}
                            height={20}
                          />
                        </button>
                        {/* Filter Dropdown Menu */}
                        {isFilterMenuOpen && (
                          <div
                            ref={filterMenuRef}
                            style={{
                              boxSizing: "border-box",
                              display: "flex",
                              flexDirection: "column",
                              justifyContent: "center",
                              alignItems: "center",
                              padding: "16px",
                              gap: "12px",
                              position: "absolute",
                              width: "min(600px, 90vw)",
                              top: "100%",
                              right: 0,
                              background: "rgba(255, 255, 255, 0.05)",
                              border: "1px solid rgba(80, 80, 80, 0.24)",
                              boxShadow: "inset 0px 0px 7px rgba(255, 255, 255, 0.16)",
                              backdropFilter: "blur(12px)",
                              borderRadius: "16px",
                              zIndex: 9,
                              overflow: "",
                            }}
                          >
                            <form onSubmit={handleFilterSubmit} className="w-full">
                              {/* 🔹 Label for the menu */}
                                <h3 className="text-white text-lg font-semibold mb-4 text-left">Filter</h3>
                              {/* 3x3 Grid for Filters */}
                              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 w-full">
                                
            
                                {/* Status Select */}
                                <div className="relative w-full">
                                  <label className="block text-sm text-gray-300 mb-1">Content Status</label>
                                  <div
                                    onClick={() => setStatusDropdownOpen(!statusDropdownOpen)}
                                    className="flex justify-between items-center p-2 bg-white/10 border border-white/20 rounded-lg text-white text-sm cursor-pointer backdrop-blur-md shadow-[inset_0_0_10px_rgba(255,255,255,0.2)] transition hover:bg-white/20"
                                  >
                                    {filters.status
                                      ? filters.status.charAt(0).toUpperCase() + filters.status.slice(1).replace(/_/g, " ")
                                      : "All Statuses"}
                                    <span className="ml-2 text-xs opacity-70">▼</span>
                                  </div>
                                  {statusDropdownOpen && (
                                    <div className="absolute top-full left-0 w-full mt-1 bg-black/80 border border-white/20 rounded-lg backdrop-blur-2xl shadow-[0_0_15px_rgba(0,0,0,0.4)] z-50 max-h-48 overflow-y-scroll"
                                      style={{
                                        scrollbarWidth: "none", // Firefox
                                        msOverflowStyle: "none", // IE/Edge
                                      }}
                                    >
                                      <div
                                        onClick={() => { handleStatusChange(""); setStatusDropdownOpen(false); }}
                                        className="p-2 text-white text-sm hover:bg-white/20 cursor-pointer"
                                      >
                                        All Statuses
                                      </div>
                                      {Object.values(CONTENT_STATUS).map((status) => (
                                        <div
                                          key={status}
                                          onClick={() => { handleStatusChange(status); setStatusDropdownOpen(false); }}
                                          className="p-2 text-white text-sm hover:bg-white/20 cursor-pointer"
                                        >
                                          {status.charAt(0).toUpperCase() + status.slice(1).replace(/_/g, " ")}
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>
            
                                {/* Category Select */}
                                <div className="relative w-full">
                                  <label className="block text-sm text-gray-300 mb-1">Category</label>
                                  <div
                                    onClick={() => setCategoryDropdownOpen(!categoryDropdownOpen)}
                                    className="flex justify-between items-center p-2 bg-white/10 border border-white/20 rounded-lg text-white text-sm cursor-pointer backdrop-blur-md shadow-[inset_0_0_10px_rgba(255,255,255,0.2)] transition hover:bg-white/20"
                                  >
                                    {filters.category ? categories.find(c => c.id === filters.category)?.name || "Select Category" : "All Categories"}
                                    <span className="ml-2 text-xs opacity-70">▼</span>
                                  </div>
                                  {categoryDropdownOpen && (
                                    <div className="absolute top-full left-0 w-full mt-1 bg-black/80 border border-white/20 rounded-lg backdrop-blur-2xl shadow-[0_0_15px_rgba(0,0,0,0.4)] z-50 max-h-48 overflow-y-scroll"
                                      style={{
                                          scrollbarWidth: "none", // Firefox
                                          msOverflowStyle: "none", // IE/Edge
                                        }}
                                    >
                                      <div
                                        onClick={() => { handleCategoryChange(""); setCategoryDropdownOpen(false); }}
                                        className="p-2 text-white text-sm hover:bg-white/20 cursor-pointer"
                                      >
                                        All Categories
                                      </div>
                                      {categories.map((cat) => (
                                        <div
                                          key={cat.id}
                                          onClick={() => { handleCategoryChange(cat.id); setCategoryDropdownOpen(false); }}
                                          className="p-2 text-white text-sm hover:bg-white/20 cursor-pointer"
                                        >
                                          {cat.name}
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>
            
                              {/* Tag Select */}
                                <div className="relative w-full">
                                  <label className="block text-sm text-gray-300 mb-1">Tag</label>
                                  <div
                                    onClick={() => setTagDropdownOpen(!tagDropdownOpen)}
                                    className="flex justify-between items-center p-2 bg-white/10 border border-white/20 rounded-lg text-white text-sm cursor-pointer backdrop-blur-md shadow-[inset_0_0_10px_rgba(255,255,255,0.2)] transition hover:bg-white/20"
                                  >
                                    {filters.tag || "All Tags"}  {/* FIXED: Display filters.tag directly (it's now the name) */}
                                    <span className="ml-2 text-xs opacity-70">▼</span>
                                  </div>
                                  {tagDropdownOpen && (
                                    <div
                                      className="absolute top-full left-0 w-full mt-1 bg-black/80 border border-white/20 rounded-lg backdrop-blur-2xl shadow-[0_0_15px_rgba(0,0,0,0.4)] z-50 max-h-48 overflow-y-scroll"
                                      style={{
                                        scrollbarWidth: "none", // Firefox
                                        msOverflowStyle: "none", // IE/Edge
                                      }}
                                    >
                                      <div
                                        onClick={() => { handleTagChange(""); setTagDropdownOpen(false); }}
                                        className="p-2 text-white text-sm hover:bg-white/20 cursor-pointer"
                                      >
                                        All Tags
                                      </div>
                                      {tags.map((tag) => (
                                        <div
                                          key={tag.id}
                                          onClick={() => { handleTagChange(tag.name); setTagDropdownOpen(false); }} 
                                          className="p-2 text-white text-sm hover:bg-white/20 cursor-pointer"
                                        >
                                          {tag.name}
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>
            
            
            
                                {/* Author Email Input */}
                                <div className="relative w-full">
                                  <label className="block text-sm text-gray-300 mb-1">Author Email</label>
                                  <input
                                    type="email"
                                    placeholder="Author email"
                                    value={filters.author_email}
                                    onChange={(e) => handleAuthorEmailChange(e.target.value)}
                                    className="w-full p-2 bg-white/10 border border-white/20 rounded-lg text-white text-sm placeholder-gray-400 backdrop-blur-md shadow-[inset_0_0_10px_rgba(255,255,255,0.2)]"
                                  />
                                </div>
            
                                {/* Created After Date */}
                                <div className="relative w-full">
                                  <label className="block text-sm text-gray-300 mb-1">Created After</label>
                                  <input
                                    type="date"
                                    value={filters.created_after}
                                    onChange={(e) => handleCreatedAfterChange(e.target.value)}
                                    className="w-full p-2 bg-white/10 border border-white/20 rounded-lg text-white text-sm backdrop-blur-md shadow-[inset_0_0_10px_rgba(255,255,255,0.2)]"
                                  />
                                </div>
            
                                {/* Created Before Date */}
                                <div className="relative w-full">
                                  <label className="block text-sm text-gray-300 mb-1">Created Before</label>
                                  <input
                                    type="date"
                                    value={filters.created_before}
                                    onChange={(e) => handleCreatedBeforeChange(e.target.value)}
                                    className="w-full p-2 bg-white/10 border border-white/20 rounded-lg text-white text-sm backdrop-blur-md shadow-[inset_0_0_10px_rgba(255,255,255,0.2)]"
                                  />
                                </div>
            
                                {/* Updated After Date */}
                                <div className="relative w-full">
                                  <label className="block text-sm text-gray-300 mb-1">Updated After</label>
                                  <input
                                    type="date"
                                    value={filters.updated_after}
                                    onChange={(e) => handleUpdatedAfterChange(e.target.value)}
                                    className="w-full p-2 bg-white/10 border border-white/20 rounded-lg text-white text-sm backdrop-blur-md shadow-[inset_0_0_10px_rgba(255,255,255,0.2)]"
                                  />
                                </div>
            
                                {/* Updated Before Date */}
                                <div className="relative w-full">
                                  <label className="block text-sm text-gray-300 mb-1">Updated Before</label>
                                  <input
                                    type="date"
                                    value={filters.updated_before}
                                    onChange={(e) => handleUpdatedBeforeChange(e.target.value)}
                                    className="w-full p-2 bg-white/10 border border-white/20 rounded-lg text-white text-sm backdrop-blur-md shadow-[inset_0_0_10px_rgba(255,255,255,0.2)]"
                                  />
                                </div>
                              </div>
            
                             {/* Buttons */}
                            <div className="flex justify-start mt-4 w-full gap-3">
                              <button
                                type="button"
                                onClick={handleResetFilters}
                               className="relative w-[100px] h-[36px] rounded-full bg-white/[0.05] border border-white/10 shadow-[inset_0_0_4px_rgba(239,214,255,0.25)] backdrop-blur-[10px] text-white font-bold text-sm flex items-center justify-center transition hover:scale-[1.02] overflow-hidden"
                              >
                                <span className="absolute inset-0 rounded-full bg-[radial-gradient(circle,rgba(255,99,99,0.5)_0%,transparent_120%)] blur-md" />
                                <span className="relative z-10">Reset</span>
                              
                              </button>
                              <button
                                type="submit"
                                className="relative w-[100px] h-[36px] rounded-full bg-white/[0.05] border border-white/10 shadow-[inset_0_0_4px_rgba(239,214,255,0.25)] backdrop-blur-[10px] text-white font-bold text-sm flex items-center justify-center transition hover:scale-[1.02] overflow-hidden"
                              >
                                <span className="absolute inset-0 rounded-full bg-[radial-gradient(circle,rgba(119,237,139,0.5)_0%,transparent_120%)] blur-md" />
                                <span className="relative z-10">Apply</span>
                             
                              </button>
                            </div>
            
                            </form>
                          </div>
                        )}
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
