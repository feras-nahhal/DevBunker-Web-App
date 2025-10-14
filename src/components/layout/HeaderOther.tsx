"use client";

import { useState, useEffect, useRef } from "react";
import DraftCategoryCard from "./DraftCategoryCard";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useTags } from "@/hooks/useTags";
import { useCategories } from "@/hooks/useCategories";
import Image from "next/image";
import "./Header1.css";

export default function HeaderOther() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const { logout } = useAuth();

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
      <header className="header">
        {/* Left: Logo */}
        <div className="header-left">
          <div className="dev">Dev</div>
          <div className="banker">banker</div>
        </div>

        {/* Right: Avatar */}
        <div className="avatar-wrapper" ref={menuRef}>
          <div className="avatar" onClick={handleAvatarClick} style={{ cursor: "pointer" }}>
            <img src="/person.jpg" alt="User Avatar" />
            <span className="status"></span>
          </div>

          {/* Avatar Dropdown */}
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
                width: "194px",
                height: "74px",
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
