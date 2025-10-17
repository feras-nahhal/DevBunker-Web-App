"use client";

import { useState } from "react";
import { useAdminTags } from "@/hooks/useAdminTags"; // your custom hook

interface CreateTagPopupProps {
  onClose: () => void;
}

export default function CreateTagPopup({ onClose }: CreateTagPopupProps) {
  const { createTag, loading } = useAdminTags();
  const [tagName, setTagName] = useState("");

  const handleSubmit = async () => {
    if (!tagName.trim()) return alert("Tag name is required");
    try {
      await createTag(tagName);
      onClose();
    } catch (err) {
      console.error(err);
      alert("Error creating tag");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div
        className="relative flex flex-col items-start p-[0_0_24px] gap-1.5 bg-white/5 border border-[rgba(80,80,80,0.24)]
                   shadow-[inset_0_0_7px_rgba(255,255,255,0.16)] backdrop-blur-[37px] rounded-[16px]"
        style={{ width: "465px", height: "200px" }}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-5 h-5 flex items-center justify-center rounded-full bg-white text-black font-bold text-xs hover:bg-gray-200 transition"
        >
          ×
        </button>

        {/* Title aligned left */}
        <h2 className="text-lg font-bold text-transparent bg-clip-text bg-gradient-to-r from-white to-green-400 mt-4 ml-6">
          Create New Tag
        </h2>

        {/* Tag input */}
        <div className="flex flex-col gap-2 w-[90%] mt-4 mx-auto">
          <label className="text-white text-sm">Tag Name</label>
          <input
            type="text"
            value={tagName}
            onChange={(e) => setTagName(e.target.value)}
            placeholder="Enter tag name"
            className="w-full p-2 bg-transparent border border-[#918AAB26] rounded text-white text-sm focus:outline-none"
          />
        </div>

        {/* Save button */}
        <button
        onClick={handleSubmit}
        disabled={loading}
        className="relative w-[150px] h-[60px] rounded-full bg-white/[0.05] border border-white/10 shadow-[inset_0_0_4px_rgba(239,214,255,0.25)] backdrop-blur-[10px] text-white font-bold text-sm flex items-center justify-center transition hover:scale-[1.02] overflow-hidden mt-2 ml-auto mr-6"
      >
        <span className="absolute inset-0 rounded-full bg-[radial-gradient(circle,rgba(119,237,139,0.5)_0%,transparent_70%)] blur-md" />
        <span className="relative z-10 text-green-400">{loading ? "..." : "Save Tag"}</span>
      </button>
      </div>
    </div>
  );
}
