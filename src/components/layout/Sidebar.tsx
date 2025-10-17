"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useRef, useEffect, useState } from "react";
import Image from "next/image";
import "./Sidebar1.css";

export default function Sidebar() {
  const pathname = usePathname();
  const glowRightRef = useRef<HTMLDivElement>(null);
  const glowLeftRef = useRef<HTMLDivElement>(null);

  // Collapse state
  const [collapsed, setCollapsed] = useState(false);

  // Load collapse state from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("sidebar-collapsed");
    if (saved === "true") setCollapsed(true);
  }, []);

  // Save collapse state
  useEffect(() => {
    localStorage.setItem("sidebar-collapsed", String(collapsed));
  }, [collapsed]);

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

  // Collapse toggle
  const toggleCollapse = () => {
    setCollapsed(!collapsed);
  };

  return (
    <aside className={`sidebar ${collapsed ? "collapsed" : ""}`}>
      {/* Collapse Button */}
      <button
        onClick={toggleCollapse}
        className={`collapse-btn ${collapsed ? "collapsed" : ""}`}
        aria-label="Toggle sidebar"
      >
        <span className="arrow" />
      </button>

      <nav className="menu">
        {/* === MENU === */}
        <div className="menu-block">
          <div className="menu-label">Menu</div>
          <Link href="/dashboard/explore" className={getClass("/dashboard/explore")}>
            <Image
              src={getIcon("/explore.svg", pathname === "/dashboard/explore")}
              alt="Explore"
              width={24}
              height={24}
            />
            <span>Explore</span>
          </Link>
        </div>

        {/* === POSTS === */}
        <div className="menu-block">
          <div className="menu-label">Posts</div>
          <Link href="/dashboard/posts" className={getClass("/dashboard/posts")}>
            <Image
              src={getIcon("/post.svg", pathname === "/dashboard/posts")}
              alt="Posts"
              width={24}
              height={24}
            />
            <span>Post List</span>
          </Link>
          <Link href="/dashboard/posts/drafts" className={getClass("/dashboard/posts/drafts")}>
            <Image
              src={getIcon("/draft.svg", pathname === "/dashboard/posts/drafts")}
              alt="Drafts"
              width={24}
              height={24}
            />
            <span>Draft</span>
          </Link>
          <Link href="/dashboard/posts/create" className={getClass("/dashboard/posts/create")}>
            <Image
              src={getIcon("/plus.svg", pathname === "/dashboard/posts/create")}
              alt="Add New"
              width={24}
              height={24}
            />
            <span>Add New</span>
          </Link>
        </div>

        {/* === MINDMAPS === */}
        <div className="menu-block">
          <div className="menu-label">Mindmaps</div>
          <Link href="/dashboard/mindmaps" className={getClass("/dashboard/mindmaps")}>
            <Image
              src={getIcon("/mindmap.svg", pathname === "/dashboard/mindmaps")}
              alt="Mindmaps"
              width={24}
              height={24}
            />
            <span>Mind List</span>
          </Link>
          <Link href="/dashboard/mindmaps/drafts" className={getClass("/dashboard/mindmaps/drafts")}>
            <Image
              src={getIcon("/draft.svg", pathname === "/dashboard/mindmaps/drafts")}
              alt="Drafts"
              width={24}
              height={24}
            />
            <span>Draft</span>
          </Link>
          <Link href="/dashboard/mindmaps/create" className={getClass("/dashboard/mindmaps/create")}>
            <Image
              src={getIcon("/plus.svg", pathname === "/dashboard/mindmaps/create")}
              alt="Add New"
              width={24}
              height={24}
            />
            <span>Add New</span>
          </Link>
        </div>

        {/* === RESEARCH === */}
        <div className="menu-block">
          <div className="menu-label">Research</div>
          <Link href="/dashboard/research" className={getClass("/dashboard/research")}>
            <Image
              src={getIcon("/Research.svg", pathname === "/dashboard/research")}
              alt="Research"
              width={24}
              height={24}
            />
            <span>Research List</span>
          </Link>
          <Link href="/dashboard/research/drafts" className={getClass("/dashboard/research/drafts")}>
            <Image
              src={getIcon("/draft.svg", pathname === "/dashboard/research/drafts")}
              alt="Drafts"
              width={24}
              height={24}
            />
            <span>Draft</span>
          </Link>
          <Link href="/dashboard/research/create" className={getClass("/dashboard/research/create")}>
            <Image
              src={getIcon("/plus.svg", pathname === "/dashboard/research/create")}
              alt="Add New"
              width={24}
              height={24}
            />
            <span>Add New</span>
          </Link>
        </div>

        {/* === DISCOVER === */}
        <div className="menu-block">
          <div className="menu-label">Discover</div>
          <Link href="/dashboard/bookmarks" className={getClass("/dashboard/bookmarks", "menu-item")}>
            <Image
              src={getIcon("/bookmark.svg", pathname === "/dashboard/bookmarks")}
              alt="Bookmarks"
              width={24}
              height={24}
            />
            <span>Bookmarks</span>
          </Link>
          <Link href="/dashboard/read-later" className={getClass("/dashboard/read-later", "menu-item")}>
            <Image
              src={getIcon("/readlater.svg", pathname === "/dashboard/read-later")}
              alt="Read Later"
              width={24}
              height={24}
            />
            <span>Read Later</span>
          </Link>
        </div>

        {/* === UPDATE === */}
        <div className="menu-block">
          <div className="menu-label">Update</div>
          <Link href="/dashboard/notifications" className={getClass("/dashboard/notifications", "menu-item")}>
            <Image
              src={getIcon("/notfication.svg", pathname === "/dashboard/notifications")}
              alt="Notifications"
              width={24}
              height={24}
            />
            <span>Notifications</span>
          </Link>
          <Link href="/dashboard/settings" className={getClass("/dashboard/settings", "menu-item")}>
            <Image
              src={getIcon("/setting.svg", pathname === "/dashboard/settings")}
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
  );
}
