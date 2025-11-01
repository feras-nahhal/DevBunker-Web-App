"use client";


import { useState } from "react";

interface DeleteConfirmPopupProps {
  type?: string;
  onConfirm: () => void;
  onClose: () => void;
  title: string;
}

export default function DeleteConfirmPopup({
  type,
  onConfirm,
  onClose,
  title
}: DeleteConfirmPopupProps) {
  const [loading, setLoading] = useState(false);

  // Capitalize the first letter of the type (e.g., "Mindmap" instead of "mindmap")
  const formattedType = type

  return (
    <div
      className="relative flex flex-col items-center p-6 gap-4
                 bg-white/5 border border-[rgba(80,80,80,0.24)]
                 shadow-[inset_0_0_7px_rgba(255,255,255,0.16)]
                 backdrop-blur-[37px] rounded-[16px]
                 w-[420px] min-h-[180px] text-center"
    >
      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 w-6 h-6 flex items-center justify-center
                   rounded-full bg-white text-black font-bold text-lg hover:bg-gray-200 transition"
      >
        ×
      </button>

      <h1 className="text-lg font-bold text-transparent bg-clip-text bg-gradient-to-r from-white to-red-400">
        Confirm Deletion
      </h1>
        {/* Title & Tags */}
           <h2 className="text-white text-sm font-medium">
            {title.length > 60 ? `${title.slice(0, 60)}...` : title}
            </h2>

      {/* Dynamic sentence */}
      <p className="text-gray-300 text-sm">
        Are you sure you want to delete this{" "}
        <span className="text-red-400 font-semibold">{formattedType}</span>?
      </p>

      <div className="flex gap-4 mt-4">
        <button
          disabled={loading}
          onClick={async () => {
            setLoading(true);
            await onConfirm();
            onClose();
          }}
          className="relative w-[150px] h-[35px] rounded-full bg-white/[0.05] border border-white/10 shadow-[inset_0_0_4px_rgba(239,214,255,0.25)] backdrop-blur-[10px] text-white font-bold text-sm flex items-center justify-center transition hover:scale-[1.02] overflow-hidden mt-2"
        >
          <span className="absolute inset-0 rounded-full bg-[radial-gradient(circle,rgba(119,237,139,0.5)_0%,transparent_70%)] blur-md" />
          <span className="relative z-10">{loading ? "Deleting..." : "Confirm Delete"}</span>
        </button>

        <button
          onClick={onClose}
          className="relative w-[150px] h-[35px] rounded-full bg-white/[0.05] border border-white/10 shadow-[inset_0_0_4px_rgba(239,214,255,0.25)] backdrop-blur-[10px] text-white font-bold text-sm flex items-center justify-center transition hover:scale-[1.02] overflow-hidden mt-2"
        >
          <span className="absolute inset-0 rounded-full bg-[radial-gradient(circle,rgba(255,99,99,0.5)_0%,transparent_70%)] blur-md" />
          <span className="relative z-10">Cancel</span>
        </button>
      </div>
    </div>
  );
}
