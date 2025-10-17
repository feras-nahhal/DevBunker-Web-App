"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import Image from "next/image";
import "./Header1.css";

export default function Header({ collapsed = false }: { collapsed?: boolean }) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const { logout } = useAuth();

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
    <header
      className={`header ${collapsed ? "collapsed" : ""}`}
      style={{
        left: collapsed ? "70px" : "260px", // Moves with sidebar
        width: collapsed ? "calc(100% - 90px)" : "calc(100% - 270px)", // Adjusts width smoothly
        transition: "all 0.3s ease",
      }}
    >
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
          <img src="/person.jpg" alt="User Avatar" />
          <span className="status"></span>
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
