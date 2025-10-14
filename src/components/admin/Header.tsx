"use client";
import { useState, ChangeEvent, useEffect, useRef } from "react";

import { useRouter } from "next/navigation"; // For client-side navigation after logout
import { useAuth } from "@/hooks/useAuth"; 

import Image from "next/image";
import "./Header1.css";

export default function Header() {
  const [search, setSearch] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false); 
  const menuRef = useRef<HTMLDivElement>(null); 
  const router = useRouter(); // For redirecting to /auth/login after logout
  const { logout } = useAuth(); // Get logout function from auth hook

  // Feedback state for success/error messages
  const [feedback, setFeedback] = useState("");
  const [feedbackType, setFeedbackType] = useState<"success" | "error">("success");

  // Close menu on click outside
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

  const handleOpenModal = () => {
    setIsModalOpen(true);
    // Clear feedback when opening modal
    setFeedback("");
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setFeedback(""); // Clear on close
  };

  // Toggle avatar menu
  const handleAvatarClick = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  // Menu option handlers (customize as needed)
  const handleProfileClick = () => {
    console.log("Profile clicked");
    setIsMenuOpen(false); // Close menu
    // Add navigation or other logic here, e.g., router.push('/profile')
  };

// Updated: Async handler for logout - calls auth hook's logout and redirects
  const handleLogoutClick = async () => {
    try {
      await logout(); // Calls the logout from useAuth (API + clear token/user state)
      console.log("Logout successful");
    } catch (err) {
      console.error("Logout error:", err);
      // Optional: Show error feedback, but proceed to redirect anyway
    }
    setIsMenuOpen(false); // Close menu
    router.push("/auth/login"); // Redirect to login page after logout
  };

  return (
    <>
      <header className="header">
        {/* Left: Logo / Dev + Banker */}
        <div className="header-left">
          <div className="dev">Dev </div>
          <div className="banker">banker</div>
        </div>

        {/* Right: Avatar with Menu */}
        <div className="avatar-wrapper" ref={menuRef}>
          <div className="avatar" onClick={handleAvatarClick} style={{ cursor: "pointer" }}>
            <img src="/person.jpg" alt="User Avatar" />
            <span className="status"></span>
          </div>

          {/* Avatar Dropdown Menu */}
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
                height: "37px", // Kept fixed, but now content fits
                top: "110%",
                right: 0,
                background: "rgba(255, 255, 255, 0.05)",
                border: "1px solid rgba(80, 80, 80, 0.24)",
                boxShadow: "inset 0px 0px 7px rgba(255, 255, 255, 0.16)",
                backdropFilter: "blur(12px)",
                borderRadius: "16px",
                zIndex: 1001,
                overflow: "hidden", // Clip any overflow cleanly
              }}
            >
              <ul style={{ listStyle: "none", margin: 0, padding: 0, width: "100%" }}>
                
                <li
                  onClick={handleLogoutClick}
                  style={{
                    padding: "10px 16px", // Reduced vertical padding
                    cursor: "pointer",
                    fontSize: "14px",
                    color: "#fff",
                    transition: "background-color 0.2s",
                    width: "195px",
                    height: "37px",
                    textAlign: "left",
                    borderRadius: "12px",
                    flex: 1, // Equally share space
                    display: "flex",
                    alignItems: "left",
                    justifyContent: "left",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = " rgba(145, 158, 171, 0.08)")}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                >
                      <Image
                    src="/logout.png" // Replace with your actual logout image path (e.g., SVG/PNG in public/icons/)
                    alt="Logout Icon"
                    width={24}
                    height={24}
                    style={{ marginRight: "6px" }} // Space between icon and text
                  />
                  Log Out
                </li>
              </ul>
            </div>
          )}
        </div>
      </header>

      {/* Modal Overlay */}
      {isModalOpen && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0, 0, 0, 0.5)", // Semi-transparent backdrop
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 1000,
            backdropFilter: "blur(4px)", // Optional blur effect
          }}
          onClick={handleCloseModal} // Close on overlay click
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
            onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside
          >
   
          
          </div>
        </div>
      )}
    </>
  );
}
