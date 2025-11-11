"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

import Image from "next/image";
import "./Header1.css";
import { useAuthContext } from "@/hooks/AuthProvider";

interface HeaderProps {
  isMobileOpen?: boolean; // NEW: For mobile sidebar state
  onMobileToggle?: (open: boolean) => void; // NEW: For toggling mobile sidebar
  profileImage?: string | null; // User profile image URL
}

export default function Header({
  collapsed = false, // ✅ NEW PROP
  isMobileOpen = false, // NEW: Default false
  onMobileToggle, // NEW: Handler
  profileImage, // NEW: Destructure the prop
}: HeaderProps & { collapsed?: boolean }) {
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

  // Handle avatar click (toggle menu)
  const handleAvatarClick = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  // Handle logout
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

  return (
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

      {/* 🔹 Left: Logo / App Name */}
      <div className="header-left">
        <div className="dev">Dev</div>
        <div className="banker">banker</div>
      </div>

      {/* 🔹 Right: Avatar and Menu */}
      <div className="avatar-wrapper" ref={menuRef}>
        <div
          className="avatar"
          onClick={handleAvatarClick}
          style={{ cursor: "pointer" }}
        >
           <img
              src={ profileImage|| "/person.jpg"} // fallback if no profile image
              alt="User Avatar"
              width={40}
              height={40}
              className="rounded-full"
            />
         
        </div>

        {isMenuOpen && (
          <div
            className="menu-dropdown"
            style={{
              boxSizing: "border-box",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              padding: "1px",
              gap: "1px",
              position: "absolute",
              width: "194px",
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
                onClick={handleLogoutClick}
                style={{
                  padding: "10px 16px",
                  cursor: "pointer",
                  fontSize: "14px",
                  color: "#fff",
                  transition: "background-color 0.2s",
                  width: "100%",
                  height: "37px",
                  textAlign: "left",
                  borderRadius: "12px",
                  display: "flex",
                  alignItems: "center",
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
                  style={{ marginRight: "8px" }}
                />
                Log Out
              </li>
            </ul>
          </div>
        )}
      </div>
    </header>
  );
}
