"use client";

import { useState } from "react";
import { useAdminCategories } from "@/hooks/useAdminCategories"; // your custom hook

interface CreateCategoryPopupProps {
  onClose: () => void;
}

export default function CreateCategoryPopup({ onClose }: CreateCategoryPopupProps) {
  const { createCategory, loading } = useAdminCategories();
  const [categoryName, setCategoryName] = useState("");
  const [description, setDescription] = useState(""); // Optional

  const handleSubmit = async () => {
    if (!categoryName.trim()) return alert("Category name is required");

    try {
      await createCategory(categoryName, description);
      onClose();
    } catch (err) {
      console.error(err);
      alert("Error creating category");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div
        className="relative flex flex-col items-start p-[0_0_24px] gap-1.5 bg-white/5 border border-[rgba(80,80,80,0.24)]
                   shadow-[inset_0_0_7px_rgba(255,255,255,0.16)] backdrop-blur-[37px] rounded-[16px]"
        style={{ width: "465px", height: "320px" }}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-5 h-5 flex items-center justify-center rounded-full bg-white text-black font-bold text-xs hover:bg-gray-200 transition"
        >
          ×
        </button>

        {/* Title */}
        <h2 className="text-lg font-bold text-transparent bg-clip-text bg-gradient-to-r from-white to-green-400 mt-4 ml-6">
          Create New Category
        </h2>

        {/* Input fields */}
        <div className="flex flex-col gap-2 w-[90%] mt-4 mx-auto">
          <label className="text-white text-sm">Category Name</label>
          <input
            type="text"
            value={categoryName}
            onChange={(e) => setCategoryName(e.target.value)}
            placeholder="Enter category name"
            className="w-full p-2 bg-transparent border border-[#918AAB26] rounded text-white text-sm focus:outline-none"
          />

          <label className="text-white text-sm mt-2">Description (optional)</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Enter description (optional)"
            className="w-full p-2 bg-transparent border border-[#918AAB26] rounded text-white text-sm focus:outline-none resize-none"
            rows={3}
          />
        </div>

        {/* Save button */}
        <button
          onClick={handleSubmit}
          disabled={loading}
          className="mt-4 w-[90%] h-9 rounded-full bg-white/5 border border-white/10 shadow-[inset_0_0_4px_rgba(119,237,139,0.25)]
                     backdrop-blur-[10px] text-white font-bold text-sm flex items-center justify-center transition hover:scale-[1.02] mx-auto"
        >
          {loading ? "..." : "Save Category"}
        </button>
      </div>
    </div>
  );
}
