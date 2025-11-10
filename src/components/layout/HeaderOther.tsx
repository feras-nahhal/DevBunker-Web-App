"use client";

import { useState, useEffect, useRef } from "react";
import DraftCategoryCard from "./DraftCategoryCard";
import { useRouter } from "next/navigation";

import { useTags } from "@/hooks/useTags";
import { useCategories } from "@/hooks/useCategories";
import Image from "next/image";
import "./Header1.css";
import { useAuthContext } from "@/hooks/AuthProvider";

interface HeaderOtherProps {
  isMobileOpen?: boolean; // NEW: For mobile sidebar state
  onMobileToggle?: (open: boolean) => void; // NEW: For toggling mobile sidebar
  profileImage?: string | null;
}

export default function HeaderOther({
  collapsed = false, // ✅ NEW PROP
  isMobileOpen = false, // NEW: Default false
  onMobileToggle, // NEW: Handler
  profileImage, // NEW: Destructure the prop
}: HeaderOtherProps & { collapsed?: boolean }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const { logout } = useAuthContext();

  // NEW: Mobile detection
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth <= 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const { requestNewTag, loading: tagsLoading } = useTags();
  const { requestNewCategory, loading: categoriesRequestLoading } = useCategories();
  const isLoading = tagsLoading || categoriesRequestLoading;

  const [feedback, setFeedback] = useState("");
  const [feedbackType, setFeedbackType] = useState<"success" | "error">("success");

  // Close menu on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    if (isMenuOpen) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isMenuOpen]);

  // Modal handlers
  const handleOpenModal = () => {
    setIsModalOpen(true);
    setFeedback("");
  };
  const handleCloseModal = () => {
    setIsModalOpen(false);
    setFeedback("");
  };

  // Avatar menu handlers
  const handleAvatarClick = () => setIsMenuOpen(!isMenuOpen);
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

  // Tag request
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
      } else {
        setFeedbackType("error");
        setFeedback(`Error requesting tag: ${result.error}`);
      }
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : "Unknown error";
      setFeedbackType("error");
      setFeedback(`Error: ${errMsg}`);
    }
    setTimeout(() => setFeedback(""), 3000);
  };

  // Category request
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
      } else {
        setFeedbackType("error");
        setFeedback(`Error requesting category: ${result.error}`);
      }
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : "Unknown error";
      setFeedbackType("error");
      setFeedback(`Error: ${errMsg}`);
    }
    setTimeout(() => setFeedback(""), 3000);
  };

  return (
    <>
       <header className={`header ${!isMobile && collapsed ? "collapsed" : ""}`}>
        {/* NEW: Hamburger Button (only on mobile) */}
        {isMobile && (
          <button
            className="hamburger-btn"
            onClick={() => onMobileToggle?.(!isMobileOpen)}
            aria-label="Toggle sidebar"
          >
            <span className="hamburger-line"></span>
            <span className="hamburger-line"></span>
            <span className="hamburger-line"></span>
          </button>
        )}
        {/* Left: Logo */}
        <div className="header-left">
          <div className="dev">Dev</div>
          <div className="banker">banker</div>
        </div>

        {/* Right: Avatar */}
        <div className="avatar-wrapper" ref={menuRef}>
          <div className="avatar" onClick={handleAvatarClick} style={{ cursor: "pointer" }}>
            <img
              src={ profileImage|| "/person.jpg"} // fallback if no profile image
              alt="User Avatar"
              width={40}
              height={40}
              className="rounded-full"
            />

            <span className="status"></span>
          </div>

          {/* Avatar Dropdown */}
          {isMenuOpen && (
            <div
              style={{
                boxSizing: "border-box",
                display: "flex",
                flexDirection: "column",
                justifyContent: "center", // centers vertically
                alignItems: "center",     // centers horizontally
                padding: "4px 4px",       // smaller padding all around
                gap: "4px",
                position: "absolute",
                width: "196px",
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
              <ul
                style={{
                  listStyle: "none",
                  margin: 0,
                  padding: 0,
                  width: "100%",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center", // centers <li> horizontally
                  gap: "2px",           // smaller gap between items
                }}
              >
                <li
                  onClick={handleOpenModal}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "flex-start",
                    width: "188px",     // slightly smaller than parent
                    height: "32px",     // smaller height
                    padding: "4px 8px", // tighter padding
                    fontSize: "14px",
                    color: "#fff",
                    borderRadius: "10px",
                    cursor: "pointer",
                    transition: "background-color 0.2s",
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.backgroundColor = "rgba(145, 158, 171, 0.08)")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.backgroundColor = "transparent")
                  }
                >
                  <Image
                    src="/requst-tag.png"
                    alt="Request Icon"
                    width={20}
                    height={20}
                    style={{ marginRight: "6px" }}
                  />
                  Request Tag/Category
                </li>

                <li
                  onClick={handleLogoutClick}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "flex-start",
                    width: "188px",
                    height: "32px",
                    padding: "4px 8px",
                    fontSize: "14px",
                    color: "#fff",
                    borderRadius: "10px",
                    cursor: "pointer",
                    transition: "background-color 0.2s",
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.backgroundColor = "rgba(145, 158, 171, 0.08)")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.backgroundColor = "transparent")
                  }
                >
                  <Image
                    src="/logout.png"
                    alt="Logout Icon"
                    width={20}
                    height={20}
                    style={{ marginRight: "6px" }}
                  />
                  Log Out
                </li>
              </ul>
            </div>)}
        </div>
      </header>

      {/* Request Modal */}
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
            <DraftCategoryCard
              draftValue=""
              categoryValue=""
              onDraftChange={handleDraftChange}
              onCategoryChange={handleCategoryChange}
              onClose={handleCloseModal}
              disabled={isLoading}
            />

            {isLoading && (
              <div style={{ color: "#FFFFFF", fontSize: "14px", fontWeight: "500" }}>Loading...</div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
