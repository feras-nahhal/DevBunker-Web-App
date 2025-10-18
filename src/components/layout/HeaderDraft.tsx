"use client";

import { useState, ChangeEvent, useEffect, useRef } from "react";
import DraftCategoryCard from "./DraftCategoryCard";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth"; 
import { useTags } from "@/hooks/useTags"; 
import { useCategories } from "@/hooks/useCategories"; // Uses your hook for categories list
import { CONTENT_STATUS } from "@/lib/enums"; // For status options
import Image from "next/image";
import "./Header1.css";

interface HeaderDraftProps {
  searchQuery: string; // Raw search for input value
  onSearchChange: (q: string) => void; // Updates raw search
  filters: Record<string, string>; // Current filters (status, category, q)
  onFiltersChange: (newFilters: Record<string, string>) => void; // Updates filters
}

export default function HeaderDraft({ 
  searchQuery, 
  onSearchChange, 
  filters, 
  onFiltersChange,
  collapsed = false
}: HeaderDraftProps & { collapsed?: boolean }) {
  const [isModalOpen, setIsModalOpen] = useState(false); // Existing: Tag/Category request modal
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false); // NEW: Filter modal
  const [isMenuOpen, setIsMenuOpen] = useState(false); 
  const [filterStatus, setFilterStatus] = useState(filters.status || ""); // NEW: Local for modal
  const [filterCategory, setFilterCategory] = useState(filters.category || ""); // NEW: Local for modal
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null); 
  const router = useRouter();
  const { logout } = useAuth();

  // Existing hooks for requests
  const { requestNewTag, loading: tagsLoading } = useTags();
  const { requestNewCategory, loading: categoriesRequestLoading } = useCategories();
  const isLoading = tagsLoading || categoriesRequestLoading;

  // NEW: Use your useCategories hook for approved categories list (fetches on mount)
  const { categories: availableCategories = [], loading: categoriesLoading } = useCategories();

  // Feedback state (existing)
  const [feedback, setFeedback] = useState("");
  const [feedbackType, setFeedbackType] = useState<"success" | "error">("success");

  // Existing: Close menu on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };

    if (isMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isMenuOpen]);

  // NEW: Ctrl+K to open filters
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === "k") {
        e.preventDefault();
        setIsFilterModalOpen(true);
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Existing: Open request modal
  const handleOpenModal = () => {
    setIsModalOpen(true);
    setFeedback("");
  };

  // Existing: Close request modal
  const handleCloseModal = () => {
    setIsModalOpen(false);
    setFeedback("");
  };

 // NEW: Open filters modal (renamed from handlefilter)
const handleOpenFilters = () => {
    // Sync local state with current filters, default to "draft" if empty
    setFilterStatus(filters.status || "draft");
    setFilterCategory(filters.category || "");
    setIsFilterModalOpen(true);
};

  // NEW: Apply filters from modal
const handleApplyFilters = () => {
  // Prepare new filters (only status and category; q is preserved in parent)
  const newFilters = {
    status: filterStatus || "draft", // UPDATED: Fallback to draft if empty
    category: filterCategory || "",
  };
  onFiltersChange(newFilters); // Triggers parent refetch
  setIsFilterModalOpen(false);
};

  // NEW: Clear filters from modal
const handleClearFilters = () => {
  setFilterStatus("draft"); // UPDATED: Always default back to draft
  setFilterCategory("");
  onFiltersChange({ status: "draft", category: "" }); // UPDATED: Default to draft
  setIsFilterModalOpen(false);
};

  // NEW: Status change in modal
  const handleStatusChange = (e: ChangeEvent<HTMLSelectElement>) => {
    setFilterStatus(e.target.value);
  };

  // NEW: Category change in modal
  const handleCategoryChange1 = (e: ChangeEvent<HTMLSelectElement>) => {
    setFilterCategory(e.target.value);
  };

  // Toggle avatar menu (existing)
  const handleAvatarClick = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  // Menu option handlers (existing)
  const handleProfileClick = () => {
    console.log("Profile clicked");
    setIsMenuOpen(false);
  };

  // Updated: Async handler for logout (existing)
  const handleLogoutClick = async () => {
    try {
      await logout();
      console.log("Logout successful");
    } catch (err) {
      console.error("Logout error:", err);
    }
    setIsMenuOpen(false);
    router.push("/auth/login");
  };

  // Async handler for draft (tag) submit (existing)
  const handleDraftChange = async (value: string) => {
    if (!value.trim()) {
      setFeedbackType("error");
      setFeedback("Error: Tag name cannot be empty.");
      setTimeout(() => setFeedback(""), 3000);
      return;
    }

    try {
      const result = await requestNewTag(value.trim());
      if (result.success) {
        setFeedbackType("success");
        setFeedback(`Tag "${value.trim()}" requested successfully! (Pending admin approval)`);
        console.log("Tag request success:", result.request);
      } else {
        setFeedbackType("error");
        setFeedback(`Error requesting tag: ${result.error}`);
        console.error("Tag request failed:", result.error);
      }
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : "Unknown error";
      setFeedbackType("error");
      setFeedback(`Error: ${errMsg}`);
      console.error("Unexpected tag request error:", err);
    }
    setTimeout(() => setFeedback(""), 3000);
  };

  // Async handler for category submit (existing)
  const handleCategoryChange = async (value: string) => {
    if (!value.trim()) {
      setFeedbackType("error");
      setFeedback("Error: Category name cannot be empty.");
      setTimeout(() => setFeedback(""), 3000);
      return;
    }

    try {
      const result = await requestNewCategory(value.trim());
      if (result.success) {
        setFeedbackType("success");
        setFeedback(`Category "${value.trim()}" requested successfully! (Pending admin approval)`);
        console.log("Category request success:", result.request);
      } else {
        setFeedbackType("error");
        setFeedback(`Error requesting category: ${result.error}`);
        console.error("Category request failed:", result.error);
      }
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : "Unknown error";
      setFeedbackType("error");
      setFeedback(`Error: ${errMsg}`);
      console.error("Unexpected category request error:", err);
    }
    setTimeout(() => setFeedback(""), 3000);
  };

  const handleDraftTagClick = () => {
    console.log("Draft tag clicked");
  };

  const handleCategoryClick = () => {
    console.log("Category clicked");
  };

  return (
    <>
      <header className={`header ${collapsed ? "collapsed" : ""}`}>
        {/* Left: Logo / Dev + Banker (existing) */}
        <div className="header-left">
          <div className="dev">Dev</div>
          <div className="banker">banker</div>
        </div>

        {/* Center: Search Bar (updated with props and button handler) */}
        <div className="search-bar">
          <button
            className="search-photo-btn"
            onClick={handleOpenFilters} // NEW: Opens filters modal
            title="Open Filters (or Ctrl+K)"
          >
            <img src="/filter.svg" alt="Open Filters" />
          </button>
          <input
            type="text"
            placeholder="Search..."
            value={searchQuery ?? ""} // NEW: Use prop
            onChange={(e) => onSearchChange(e.target.value)} // NEW: Call prop handler
          />
          <div className="ctrl-icon">
            <img src="/ctrul.svg" alt="ctrl" />
            {/* Optional: Hint for Ctrl+K */}
            
          </div>
        </div>

        {/* Right: Avatar with Menu (existing) */}
        <div className="avatar-wrapper" ref={menuRef}>
          <div className="avatar" onClick={handleAvatarClick} style={{ cursor: "pointer" }}>
            <img src="/person.jpg" alt="User  Avatar" />
            <span className="status"></span>
          </div>

          {/* Avatar Dropdown Menu (existing) */}
          {isMenuOpen && (
            <div
              style={{
                boxSizing: "border-box",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                padding: "1px",
                gap: "1px",
                position: "absolute",
                width: "198px",
                height: "78px",
                top: "110%",
                right: 0,
                background: "rgba(255, 255, 255, 0.05)",
                border: "1px solid rgba(80, 80, 80, 0.24)",
                boxShadow: "inset 0px 0px 7px rgba(255, 255, 255, 0.16)",
                backdropFilter: "blur(12px)",
                borderRadius: "16px",
                zIndex: 1001,
                overflow: "hidden",
              }}
            >
              <ul style={{ listStyle: "none", margin: 0, padding: 0, width: "100%" }}>
                <li
                  onClick={handleOpenModal} // Existing: Opens request modal
                  style={{
                    padding: "10px 16px",
                    cursor: "pointer",
                    fontSize: "14px",
                    color: "#fff",
                    transition: "background-color 0.2s",
                    width: "195px",
                    height: "37px",
                    textAlign: "left",
                    borderRadius: "12px",
                    flex: 1,
                    display: "flex",
                    alignItems: "left",
                    justifyContent: "left",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "rgba(145, 158, 171, 0.08)")}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                >
                  <Image
                    src="/requst-tag.png"
                    alt="Request Icon"
                    width={24}
                    height={24}
                    style={{ marginRight: "6px" }}
                  />
                  Requst Tag/Category
                </li>
                <li
                  onClick={handleLogoutClick}
                  style={{
                    padding: "10px 16px",
                    cursor: "pointer",
                    fontSize: "14px",
                    color: "#fff",
                    transition: "background-color 0.2s",
                    width: "195px",
                    height: "37px",
                    textAlign: "left",
                    borderRadius: "12px",
                    flex: 1,
                    display: "flex",
                    alignItems: "left",
                    justifyContent: "left",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "rgba(145, 158, 171, 0.08)")}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                >
                  <Image
                    src="/logout.png"
                    alt="Logout Icon"
                    width={24}
                    height={24}
                    style={{ marginRight: "6px" }}
                  />
                  Log Out
                </li>
              </ul>
            </div>
          )}
        </div>
      </header>

      {/* Existing: Request Modal Overlay (for Tag/Category requests) */}
      {isModalOpen && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 1000,
            backdropFilter: "blur(4px)",
          }}
          onClick={handleCloseModal}
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-title"
        >
          <div
            style={{
              position: "relative",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "16px",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* DraftCategoryCard (existing) */}
            <DraftCategoryCard
              draftValue=""
              categoryValue=""
              onDraftChange={handleDraftChange}
              onCategoryChange={handleCategoryChange}
              onClose={handleCloseModal}
              onDraftTagClick={handleDraftTagClick}
              onCategoryClick={handleCategoryClick}
              disabled={isLoading}
            />

            {/* Loading Indicator (existing) */}
            {isLoading && (
              <div
                style={{
                  color: "#FFFFFF",
                  fontSize: "14px",
                  fontWeight: "500",
                }}
              >
                Loading...
              </div>
            )}
          </div>
        </div>
      )}

      {/* NEW: Filter Modal Overlay */}
      {isFilterModalOpen && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 1000,
            backdropFilter: "blur(4px)",
          }}
          onClick={() => setIsFilterModalOpen(false)} // Close on overlay
          role="dialog"
          aria-modal="true"
          aria-labelledby="filter-modal-title"
        >
          <div
            style={{
              position: "relative",
              background: "rgba(255, 255, 255, 0.05)",
              border: "1px solid rgba(80, 80, 80, 0.24)",
              borderRadius: "16px",
              padding: "24px",
              width: "min(90vw, 400px)",
              color: "white",
              boxShadow: "inset 0px 0px 7px rgba(255, 255, 255, 0.16)",
              backdropFilter: "blur(12px)",
            }}
            onClick={(e) => e.stopPropagation()} // Prevent close on inner click
          >
            <h3 
              id="filter-modal-title"
              style={{ 
                marginBottom: "16px", 
                fontSize: "18px", 
                textAlign: "center",
                fontWeight: "bold"
              }}
            >
              Filters
            </h3>

            

           {/* Category Select */}
              <div className="relative w-full mt-2 mx-auto">
              {/* Dropdown header */}
              <div
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex justify-between items-center p-2 bg-white/10 border border-white/20 rounded-lg text-white text-sm cursor-pointer backdrop-blur-md shadow-[inset_0_0_10px_rgba(255,255,255,0.2)] transition hover:bg-white/20"
              >
                {filterCategory
                  ? availableCategories.find((cat) => cat.id === filterCategory)?.name
                  : "All Categories"}
                <span className="ml-2 text-xs opacity-70">▼</span>
              </div>

              {/* Dropdown menu */}
              {dropdownOpen && (
                <div
                  className="absolute top-full left-0 w-full mt-1 bg-white/10 border border-white/20 rounded-lg backdrop-blur-lg shadow-[0_0_10px_rgba(255,255,255,0.1)] z-50 max-h-48 overflow-y-scroll"
                  style={{
                    scrollbarWidth: "none", // Firefox
                    msOverflowStyle: "none", // IE/Edge
                  }}
                >
                  {/* Hide scrollbar for Chrome, Safari, Edge */}
                  <style>
                    {`
                      div::-webkit-scrollbar {
                        display: none;
                      }
                    `}
                  </style>

                  <div
                    onClick={() => {
                      handleCategoryChange1({ target: { value: "" } } as React.ChangeEvent<HTMLSelectElement>);
                      setDropdownOpen(false);
                    }}
                    className="p-2 text-white text-sm hover:bg-white/20 cursor-pointer"
                  >
                    All Categories
                  </div>

                  {availableCategories.map((cat) => (
                    <div
                      key={cat.id}
                      onClick={() => {
                        handleCategoryChange1({ target: { value: cat.id } } as React.ChangeEvent<HTMLSelectElement>);
                        setDropdownOpen(false);
                      }}
                      className="p-2 text-white text-sm hover:bg-white/20 cursor-pointer"
                    >
                      {cat.name}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Buttons: Apply and Clear */}
            <div
              style={{
                display: "flex",
                gap: "12px",
                justifyContent: "center",
                marginTop: "8px",
              }}
            >
             <button
                onClick={handleApplyFilters}
                className="relative w-[170px] h-[36px] rounded-full bg-white/[0.05] border border-white/10 shadow-[inset_0_0_4px_rgba(239,214,255,0.25)] backdrop-blur-[10px] text-white font-bold text-sm flex items-center justify-center transition hover:scale-[1.02] overflow-hidden"
              >
                 <span className="absolute inset-0 rounded-full bg-[radial-gradient(circle,rgba(119,237,139,0.5)_0%,transparent_70%)] blur-md" />
                <span className="relative z-10">Apply Filters</span>
                
              </button>
              <button
                onClick={handleClearFilters}
                 className="relative w-[170px] h-[36px] rounded-full bg-white/[0.05] border border-white/10 shadow-[inset_0_0_4px_rgba(239,214,255,0.25)] backdrop-blur-[10px] text-white font-bold text-sm flex items-center justify-center transition hover:scale-[1.02] overflow-hidden"
              >
                 <span className="absolute inset-0 rounded-full bg-[radial-gradient(circle,rgba(255,99,99,0.5)_0%,transparent_70%)] blur-md" />
                <span className="relative z-10">Clear All</span>
               
              </button>
            </div>
          </div>
        </div>
      )}

      {/* End of component return */}
    </>
  );
}
