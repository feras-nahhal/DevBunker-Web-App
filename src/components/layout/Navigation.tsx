"use client";

import Link from "next/link";

const navItems = [
  { label: "Explore", href: "/explore" },
  { label: "Posts", href: "/posts" },
  { label: "Mindmaps", href: "/mindmaps" },
  { label: "Research", href: "/research" },
];

export function Navigation() {
  return (
    <nav className="flex gap-6 text-sm font-medium text-gray-300">
      {navItems.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className="hover:text-white transition"
        >
          {item.label}
        </Link>
      ))}
    </nav>
  );
}
