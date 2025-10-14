"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useRef, useEffect, useState } from "react";
import Image from "next/image";
import CreateUserPopup from "@/components/admin/CreateUserPopup"; // User popup
import CreateTagPopup from "@/components/admin/CreateTagPopup";   // NEW Tag popup
import CreateCategoryPopup from "@/components/admin/CreateCategoryPopup"; // NEW Category popup

import "./Sidebar1.css";

export default function Sidebar() {
  const pathname = usePathname();
  const glowRightRef = useRef<HTMLDivElement>(null);
  const glowLeftRef = useRef<HTMLDivElement>(null);

  const [showCreateUserPopup, setShowCreateUserPopup] = useState(false);
  const [showCreateTagPopup, setShowCreateTagPopup] = useState(false);
  const [showCreateCategoryPopup, setShowCreateCategoryPopup] = useState(false);


  const getClass = (path: string, baseClass: string = "menu-subitem") =>
    pathname === path ? `${baseClass} active` : baseClass;

  useEffect(() => {
    const moveGlow = () => {
      const activeItem = document.querySelector(".menu-item.active, .menu-subitem.active");
      if (!activeItem) return;

      const rect = activeItem.getBoundingClientRect();
      const sidebarRect = activeItem.closest(".sidebar")!.getBoundingClientRect();

      if (glowRightRef.current) {
        glowRightRef.current.style.top = rect.top - sidebarRect.top + "px";
      }
      if (glowLeftRef.current) {
        glowLeftRef.current.style.top = rect.top - sidebarRect.top + "px";
      }
    };

    moveGlow();
  }, [pathname]);

  return (
    <>
      <aside className="sidebar">
        <nav className="menu">
          {/* === MENU === */}
          <div className="menu-block">
            <div className="menu-label">Management</div>

            <Link href="/admin/users" className={getClass("/admin/users")}>
              <Image src="/user1.svg" alt="Add New Tag" width={24} height={24} />
              <span>User</span>
            </Link>

            {/* Add User Button triggers popup */}
            <button
              onClick={() => setShowCreateUserPopup(true)}
              className={getClass("/admin/users/create")}
            >
              <Image src="/plus.svg" alt="Add New Tag" width={24} height={24} />
              <span>Add User</span>
            </button>
          </div>

          {/* === POSTS === */}
          <div className="menu-block">
            <div className="menu-label">Content</div>
            <Link href="/admin/content" className={getClass("/admin/content")}>
              <Image src="/Research.svg" alt="Add New Tag" width={24} height={24} />
              <span>Research</span>
            </Link>
          </div>

          {/* === TAG === */}
          <div className="menu-block">
            <div className="menu-label">Tag</div>
            <Link href="/admin/tags" className={getClass("/admin/tags")}>
              <Image src="/tag.svg" alt="Add New Tag" width={24} height={24} />
              <span>Tag</span>
            </Link>

            {/* Add Tag Button triggers popup */}
            <button
              onClick={() => setShowCreateTagPopup(true)}
              className={getClass("/admin/tag/create")}
            >
              <Image src="/plus.svg" alt="Add New Tag" width={24} height={24} />
              <span>Add New</span>
            </button>
          </div>

          {/* === CATEGORIES === */}
          <div className="menu-block">
            <div className="menu-label">Categories</div>
            <Link href="/admin/categories" className={getClass("/admin/categories")}>
              <Image src="/category.svg" alt="Add New Tag" width={24} height={24} />
              <span>Categories</span>
            </Link>
            {/* Add Category Button triggers popup */}
            <button
              onClick={() => setShowCreateCategoryPopup(true)}
              className={getClass("/admin/categories/create")}
            >
              <Image src="/plus.svg" alt="Add New Tag" width={24} height={24} />
              <span>Add New</span>
            </button>

          </div>

          {/* === UPDATE === */}
          <div className="menu-block">
            <div className="menu-label">Update</div>
            <Link href="/admin/notifications" className={getClass("/admin/notifications", "menu-item")}>
              <Image src="/notfication.svg" alt="Add New Tag" width={24} height={24} />
              <span>Notifications</span>
            </Link>
            <Link href="/admin/settings" className={getClass("/admin/settings", "menu-item")}>
              <Image src="/setting.svg" alt="Add New Tag" width={24} height={24} />
              <span>Settings</span>
            </Link>
          </div>
        </nav>

        {/* Traveling glows */}
        <div className="sidebar-glow" ref={glowRightRef}></div>
        <div className="sidebar-glow-left" ref={glowLeftRef}></div>
      </aside>

      {/* ================= POPUPS ================= */}
      {showCreateUserPopup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <CreateUserPopup onClose={() => setShowCreateUserPopup(false)} />
        </div>
      )}

      {showCreateTagPopup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <CreateTagPopup onClose={() => setShowCreateTagPopup(false)} />
        </div>
      )}

      {showCreateCategoryPopup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <CreateCategoryPopup onClose={() => setShowCreateCategoryPopup(false)} />
        </div>
      )}

    </>
  );
}
