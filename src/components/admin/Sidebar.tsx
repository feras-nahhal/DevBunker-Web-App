"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useRef, useEffect, useState } from "react";
import Image from "next/image";
import "./Sidebar1.css";
import CreateCategoryPopup from "./CreateCategoryPopup";
import CreateTagPopup from "./CreateTagPopup";
import CreateUserPopup from "./CreateUserPopup";

export default function Sidebar({ 
  onToggle, 
  isMobileOpen = false, 
  onMobileToggle 
}: { 
  onToggle?: (collapsed: boolean) => void; 
  isMobileOpen?: boolean; 
  onMobileToggle?: (open: boolean) => void; 
}) {
  const pathname = usePathname();
  const glowRightRef = useRef<HTMLDivElement>(null);
  const glowLeftRef = useRef<HTMLDivElement>(null);

  // Collapse state (for desktop)
  const [collapsed, setCollapsed] = useState(false);

  // Mobile detection
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth <= 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Load collapse state from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("sidebar-collapsed");
    if (saved === "true") setCollapsed(true);
  }, []);

  // Save collapse state on change + notify parent
  useEffect(() => {
    localStorage.setItem("sidebar-collapsed", String(collapsed));
    onToggle?.(collapsed);
  }, [collapsed, onToggle]);

  const [showCreateUserPopup, setShowCreateUserPopup] = useState(false);
  const [showCreateTagPopup, setShowCreateTagPopup] = useState(false);
  const [showCreateCategoryPopup, setShowCreateCategoryPopup] = useState(false);
  

  // Helper: determine active class
  const getClass = (path: string, baseClass: string = "menu-subitem") =>
    pathname === path ? `${baseClass} active` : baseClass;

  // Helper: get active/inactive icon
  const getIcon = (base: string, isActive: boolean) => {
    if (!isActive) return base;
    const parts = base.split(".");
    return `${parts[0]}g.${parts[1]}`; // e.g. /post.svg → /postg.svg
  };

  // Handle glowing effect
  useEffect(() => {
    const moveGlow = () => {
      const activeItem = document.querySelector(".menu-item.active, .menu-subitem.active");
      if (!activeItem) return;
      const rect = activeItem.getBoundingClientRect();
      const sidebarRect = activeItem.closest(".sidebar")!.getBoundingClientRect();

      if (glowRightRef.current)
        glowRightRef.current.style.top = rect.top - sidebarRect.top + "px";
      if (glowLeftRef.current)
        glowLeftRef.current.style.top = rect.top - sidebarRect.top + "px";
    };
    moveGlow();
  }, [pathname]);

  // Recalculate glow when mobile sidebar opens
useEffect(() => {
  if (isMobile && isMobileOpen) {
    // Wait for the slide-in transition (300ms)
    setTimeout(() => {
      const activeItem = document.querySelector(".menu-item.active, .menu-subitem.active");
      if (!activeItem) return;
      const rect = activeItem.getBoundingClientRect();
      const sidebarRect = activeItem.closest(".sidebar")!.getBoundingClientRect();
      if (glowRightRef.current)
        glowRightRef.current.style.top = rect.top - sidebarRect.top + "px";
      if (glowLeftRef.current)
        glowLeftRef.current.style.top = rect.top - sidebarRect.top + "px";
    }, 350); // Slightly longer than your CSS transition (300ms)
  }
}, [isMobileOpen, pathname]);


  // Collapse toggle (desktop)
  const toggleCollapse = () => {
    const newState = !collapsed;
    setCollapsed(newState);
    localStorage.setItem("sidebar-collapsed", String(newState));
    onToggle?.(newState);
  };

  // Close mobile sidebar on link click
  const handleLinkClick = () => {
    if (isMobile && onMobileToggle) onMobileToggle(false);
  };

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isMobile && isMobileOpen && onMobileToggle) {
        onMobileToggle(false);
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isMobile, isMobileOpen, onMobileToggle]);

  // Don't render sidebar on mobile unless open
  if (isMobile && !isMobileOpen) return null;

  return (
    <>
      {/* Backdrop for mobile overlay */}
      {isMobile && isMobileOpen && (
        <div 
          className="sidebar-backdrop" 
          onClick={() => onMobileToggle?.(false)} 
          aria-hidden="true"
        />
      )}

      <aside className={`sidebar ${collapsed && !isMobile ? "collapsed" : ""} ${isMobile ? "mobile" : ""} ${isMobile && isMobileOpen ? "open" : ""}`}>
        {/* === COLLAPSE BUTTON (only on desktop) === */}
        {!isMobile && (
          <button
            onClick={toggleCollapse}
            className={`collapse-btn ${collapsed ? "collapsed" : ""}`}
            aria-label="Toggle sidebar"
          >
            <span className="arrow" />
          </button>
        )}

        <nav className="menu">
 {/* === MANAGEMENT === */}
          <div className="menu-block">
            <div className="menu-label">Management</div>

            <Link href="/admin/users" className={getClass("/admin/users")}>
              <Image
                src={getIcon("/user.svg", pathname === "/admin/users")}
                alt="Users"
                width={24}
                height={24}
              />
              <span>User</span>
            </Link>

            <button
              onClick={() => setShowCreateUserPopup(true)}
              className={getClass("/admin/users/create")}
            >
              <Image
                src={getIcon("/plus.svg", pathname === "/admin/users/create")}
                alt="Add User"
                width={24}
                height={24}
              />
              <span>Add User</span>
            </button>
          </div>

          {/* === CONTENT === */}
          <div className="menu-block">
            <div className="menu-label">Content</div>
            <Link href="/admin/content" className={getClass("/admin/content")}>
              <Image
                src={getIcon("/Research.svg", pathname === "/admin/content")}
                alt="Research"
                width={24}
                height={24}
              />
              <span>Research</span>
            </Link>
          </div>

          {/* === TAGS === */}
          <div className="menu-block">
            <div className="menu-label">Tags</div>
            <Link href="/admin/tags" className={getClass("/admin/tags")}>
              <Image
                src={getIcon("/tag.svg", pathname === "/admin/tags")}
                alt="Tags"
                width={24}
                height={24}
              />
              <span>Tag</span>
            </Link>

            <button
              onClick={() => setShowCreateTagPopup(true)}
              className={getClass("/admin/tag/create")}
            >
              <Image
                src={getIcon("/plus.svg", pathname === "/admin/tag/create")}
                alt="Add New Tag"
                width={24}
                height={24}
              />
              <span>Add New</span>
            </button>
          </div>

          {/* === CATEGORIES === */}
          <div className="menu-block">
            <div className="menu-label">Categories</div>
            <Link href="/admin/categories" className={getClass("/admin/categories")}>
              <Image
                src={getIcon("/category.svg", pathname === "/admin/categories")}
                alt="Categories"
                width={24}
                height={24}
              />
              <span>Categories</span>
            </Link>

            <button
              onClick={() => setShowCreateCategoryPopup(true)}
              className={getClass("/admin/categories/create")}
            >
              <Image
                src={getIcon("/plus.svg", pathname === "/admin/categories/create")}
                alt="Add New Category"
                width={24}
                height={24}
              />
              <span>Add New</span>
            </button>
          </div>

          {/* === UPDATE === */}
          <div className="menu-block">
            <div className="menu-label">Update</div>
            <Link
              href="/admin/notifications"
              className={getClass("/admin/notifications", "menu-item")}
            >
              <Image
                src={getIcon("/notfication.svg", pathname === "/admin/notifications")}
                alt="Notifications"
                width={24}
                height={24}
              />
              <span>Notifications</span>
            </Link>
            <Link
              href="/admin/settings"
              className={getClass("/admin/settings", "menu-item")}
            >
              <Image
                src={getIcon("/setting.svg", pathname === "/admin/settings")}
                alt="Settings"
                width={24}
                height={24}
              />
              <span>Settings</span>
            </Link>
          </div>
        </nav>

        {/* Glows */}
        <div className="sidebar-glow" ref={glowRightRef}></div>
        <div className="sidebar-glow-left" ref={glowLeftRef}></div>
      </aside>
      
      {/* POPUPS */}
      {showCreateUserPopup && (
        <div className="fixed inset-0 z-1000 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <CreateUserPopup onClose={() => setShowCreateUserPopup(false)} />
        </div>
      )}

      {showCreateTagPopup && (
        <div className="fixed inset-0 z-1000 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <CreateTagPopup onClose={() => setShowCreateTagPopup(false)} />
        </div>
      )}

      {showCreateCategoryPopup && (
        <div className="fixed inset-0 z-1000 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <CreateCategoryPopup onClose={() => setShowCreateCategoryPopup(false)} />
        </div>
      )}

    </>
  );
}