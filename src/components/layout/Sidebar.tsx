"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useRef, useEffect } from "react";
import {
  FileText,
  Pencil,
  Plus,
  Brain,
  Microscope,
  Bookmark,
  Settings,
} from "lucide-react";
import Image from "next/image";
import "./Sidebar1.css";

export default function Sidebar() {
  const pathname = usePathname();
  const glowRightRef = useRef<HTMLDivElement>(null);
  const glowLeftRef = useRef<HTMLDivElement>(null);

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
    <aside className="sidebar">
      <nav className="menu">
        {/* === MENU === */}
        <div className="menu-block">
          <div className="menu-label">Menu</div>
          <Link href="/dashboard/explore" className={getClass("/dashboard/explore")}>
            <Image src="/explore.svg" alt="Add New Tag" width={24} height={24} />
            <span>Explore</span>
          </Link>
        </div>

        {/* === POSTS === */}
        <div className="menu-block">
          <div className="menu-label">Posts</div>
          <Link href="/dashboard/posts" className={getClass("/dashboard/posts")}>
          <Image src="/post.svg" alt="Add New Tag" width={24} height={24} />
           
            <span>Post List</span>
          </Link>
          <Link href="/dashboard/posts/drafts" className={getClass("/dashboard/posts/drafts")}>
            <Image src="/draft.svg" alt="Add New Tag" width={24} height={24} />
            <span>Draft</span>
          </Link>
          <Link href="/dashboard/posts/create" className={getClass("/dashboard/posts/create")}>
            <Image src="/plus.svg" alt="Add New Tag" width={24} height={24} />
            <span>Add New</span>
          </Link>
        </div>

        {/* === MINDMAPS === */}
        <div className="menu-block">
          <div className="menu-label">Mindmaps</div>
          <Link href="/dashboard/mindmaps" className={getClass("/dashboard/mindmaps")}>
            <Image src="/mindmap.svg" alt="Add New Tag" width={24} height={24} />
            <span>Mind List</span>
          </Link>
          <Link href="/dashboard/mindmaps/drafts" className={getClass("/dashboard/mindmaps/drafts")}>
            <Image src="/draft.svg" alt="Add New Tag" width={24} height={24} />
            <span>Draft</span>
          </Link>
          <Link href="/dashboard/mindmaps/create" className={getClass("/dashboard/mindmaps/create")}>
            <Image src="/plus.svg" alt="Add New Tag" width={24} height={24} />
            <span>Add New</span>
          </Link>
        </div>

        {/* === RESEARCH === */}
        <div className="menu-block">
          <div className="menu-label">Research</div>
          <Link href="/dashboard/research" className={getClass("/dashboard/research")}>
            <Image src="/Research.svg" alt="Add New Tag" width={24} height={24} />
            <span>Mind List</span>
          </Link>
          <Link href="/dashboard/research/drafts" className={getClass("/dashboard/research/drafts")}>
            <Image src="/draft.svg" alt="Add New Tag" width={24} height={24} />
            <span>Draft</span>
          </Link>
          <Link href="/dashboard/research/create" className={getClass("/dashboard/research/create")}>
            <Image src="/plus.svg" alt="Add New Tag" width={24} height={24} />
            <span>Add New</span>
          </Link>
        </div>

        {/* === DISCOVER === */}
        <div className="menu-block">
          <div className="menu-label">Discover</div>
          <Link href="/dashboard/bookmarks" className={getClass("/dashboard/bookmarks", "menu-item")}>
            <Image src="/bookmark.svg" alt="Add New Tag" width={24} height={24} />
            <span>Bookmarks</span>
          </Link>
          <Link href="/dashboard/read-later" className={getClass("/dashboard/read-later", "menu-item")}>
            <Image src="/readlater.svg" alt="Add New Tag" width={24} height={24} />
            <span>Read-later</span>
          </Link>
        </div>

        {/* === UPDATE === */}
        <div className="menu-block">
          <div className="menu-label">Update</div>
          <Link href="/dashboard/notifications" className={getClass("/dashboard/notifications", "menu-item")}>
            <Image src="/notfication.svg" alt="Add New Tag" width={24} height={24} />
            <span>Notifications</span>
          </Link>
          <Link href="/dashboard/settings" className={getClass("/dashboard/settings", "menu-item")}>
            <Image src="/setting.svg" alt="Add New Tag" width={24} height={24} />
            <span>Settings</span>
          </Link>
        </div>
      </nav>

      {/* Traveling glows */}
      <div className="sidebar-glow" ref={glowRightRef}></div>
      <div className="sidebar-glow-left" ref={glowLeftRef}></div>
    </aside>
  );
}
