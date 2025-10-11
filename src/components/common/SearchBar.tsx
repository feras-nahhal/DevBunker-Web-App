"use client";

import { Search } from "lucide-react";

export function SearchBar() {
  return (
    <div className="flex items-center w-[514px] h-12 border border-white/10 rounded-full px-3 gap-3">
      {/* Icon container */}
      <div className="flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-b from-white/15 to-white/5">
        <Search className="w-5 h-5 text-white opacity-80" />
      </div>

      {/* Input */}
      <input
        type="text"
        placeholder="Search..."
        className="flex-1 bg-transparent border-none outline-none text-sm text-gray-300 placeholder-gray-500"
      />
    </div>
  );
}
