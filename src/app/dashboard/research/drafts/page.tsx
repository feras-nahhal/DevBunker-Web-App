"use client";
import { useState, useEffect, useRef } from "react";
import { useDebounce } from "@/hooks/useDebounce";
import { useRouter } from "next/navigation";
import Image from "next/image";
import HeaderDraft from "@/components/layout/HeaderDraft";
import Sidebar from "@/components/layout/Sidebar";
import DraftGrid from "@/components/content/DraftGrid";
import "./researchDraftPage.css";
import DraftCardSkeleton from "@/components/content/DraftCardSkeleton";
import { useAuthContext } from "@/hooks/AuthProvider";

export default function ResearchDraftPage() {
  const router = useRouter();
  const { user, loading, isAuthenticated } = useAuthContext();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false); // NEW: Separate state for mobile sidebar
  // Add to states:
  const [references, setReferences] = useState<string[]>([]);  // NEW: For reference texts
  const [referenceTextDropdownOpen, setReferenceTextDropdownOpen] = useState(false);  // NEW: Dropdown state

  // -----------------------------
  // States
  // -----------------------------
  const [searchQuery, setSearchQuery] = useState(""); // Raw search input
  // Add to filters state:
  const [filters, setFilters] = useState<Record<string, string>>({ 
    status: "draft", 
    category: "",
    tag: "",
    author_email: "",
    created_after: "",
    created_before: "",
    updated_after: "",
    updated_before: "",
    has_references: "",
    reference_text: "",  // NEW: Specific reference text
    type: "all",
  });
  
  const [selectedContentId, setSelectedContentId] = useState<string | null>(null);
  const [isFilterMenuOpen, setIsFilterMenuOpen] = useState(false);
  const filterMenuRef = useRef<HTMLDivElement>(null);

  // States for fetched data
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);
  const [tags, setTags] = useState<{ id: string; name: string }[]>([]);

  // States for dropdown open/close
  const [statusDropdownOpen, setStatusDropdownOpen] = useState(false);
  const [categoryDropdownOpen, setCategoryDropdownOpen] = useState(false);
  const [tagDropdownOpen, setTagDropdownOpen] = useState(false);
  const [typeDropdownOpen, setTypeDropdownOpen] = useState(false);
  const [hasReferencesDropdownOpen, setHasReferencesDropdownOpen] = useState(false);  // NEW: Dropdown state

  const debouncedSearchQuery = useDebounce(searchQuery, 300);

  useEffect(() => {
    setFilters((prev) => ({ ...prev, q: debouncedSearchQuery }));
  }, [debouncedSearchQuery]);

  // Fetch references on mount (add to useEffect for fetchData)
useEffect(() => {
  const fetchData = async () => {
    try {
      const [catRes, tagRes, refRes] = await Promise.all([
        fetch("/api/categories"),
        fetch("/api/tags"),
        fetch("/api/reference-search"),  
      ]);
      const catData = await catRes.json();
      const tagData = await tagRes.json();
      const refData = await refRes.json();
      if (catData.categories) setCategories(catData.categories);
      if (tagData.tags) setTags(tagData.tags);
      if (refData.references) setReferences(refData.references);  // Now an array of strings
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };
  fetchData();
}, []);

// Add handler:
const handleReferenceTextChange = (value: string) => {
  setFilters((prev) => ({ ...prev, reference_text: value }));
};

  const handleSearchChange = (q: string) => setSearchQuery(q);

  const handleFiltersChange = (newFilters: Record<string, string>) => {
    const updatedFilters = {
      ...newFilters,
      status: newFilters.status || "draft", // Always ensure draft if not specified
      q: debouncedSearchQuery,
    };
    setFilters(updatedFilters);
  };

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
  const handleHasReferencesChange = (value: string) => {  // NEW: Handler for references
    setFilters((prev) => ({ ...prev, has_references: value }));
  };

  // Handle filter menu submission
  const handleFilterSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    // Close all dropdowns and menu
    setStatusDropdownOpen(false);
    setCategoryDropdownOpen(false);
    setTagDropdownOpen(false);
    setTypeDropdownOpen(false);
    setHasReferencesDropdownOpen(false);  // NEW: Close references dropdown
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
      reference_text: "",  // NEW: Reset reference text
      type: "all",
      q: debouncedSearchQuery,
    });
    setStatusDropdownOpen(false);
    setCategoryDropdownOpen(false);
    setTagDropdownOpen(false);
    setTypeDropdownOpen(false);
    setHasReferencesDropdownOpen(false);  // NEW: Close references dropdown
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
        setReferenceTextDropdownOpen(false);  // NEW
      }
    };
    if (isFilterMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isFilterMenuOpen]);

 // Read "id" query parameter for opening content popup
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      setSelectedContentId(params.get("id"));
    }
  }, []);

  // -----------------------------
  // Redirect if not authenticated (optional)
  // -----------------------------
  useEffect(() => {
    if (!loading && !user) {
      router.push("/auth/login");
    }
  }, [user, loading, router]);

  // -----------------------------
  // Conditional render until auth finishes
  // -----------------------------
  if (loading || (!user && !loading)) return (
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

        <div className="research-container">
          {/* 🔹 Menu / research Title Row */}
          <div className="flex items-center mb-4 relative">
            <Image
              src="/draft.svg"
              alt="Menu Icon"
              width={25}
              height={25}
              className="object-contain mr-[4px] relative top-[1px]"
            />
            <h2
              className="font-[400] text-[14px] leading-[22px] text-[#707070]"
              style={{ fontFamily: "'Public Sans', sans-serif" }}
            >
              Research / Draft
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


                    {/* Reference Text Select */}  {/* NEW: Specific reference text filter */}
                      <div className="relative w-full">
                        <label className="block text-sm text-gray-300 mb-1">Reference Link</label>
                        <div
                          onClick={() => setReferenceTextDropdownOpen(!referenceTextDropdownOpen)}
                          className="flex justify-between items-center p-2 bg-white/10 border border-white/20 rounded-lg text-white text-sm cursor-pointer backdrop-blur-md shadow-[inset_0_0_10px_rgba(255,255,255,0.2)] transition hover:bg-white/20"
                        >
                          {filters.reference_text || "All Reference Links"}
                          <span className="ml-2 text-xs opacity-70">▼</span>
                        </div>
                        {referenceTextDropdownOpen && (
                          <div
                            className="absolute top-full left-0 w-full mt-1 bg-black/80 border border-white/20 rounded-lg backdrop-blur-2xl shadow-[0_0_15px_rgba(0,0,0,0.4)] z-50 max-h-48 overflow-y-scroll"
                            style={{
                              scrollbarWidth: "none", // Firefox
                              msOverflowStyle: "none", // IE/Edge
                            }}
                          >
                            <div
                              onClick={() => { handleReferenceTextChange(""); setReferenceTextDropdownOpen(false); }}
                              className="p-2 text-white text-sm hover:bg-white/20 cursor-pointer"
                            >
                              All Reference Links
                            </div>
                            {references.map((ref, index) => (
                              <div
                                key={index}
                                onClick={() => { handleReferenceTextChange(ref); setReferenceTextDropdownOpen(false); }}
                                className="p-2 text-white text-sm hover:bg-white/20 cursor-pointer"
                              >
                                {ref}
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
          <DraftGrid type="research" searchQuery={searchQuery} filters={filters} />
        </div>
      </div>
    </div>
  );
}