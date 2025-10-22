"use client";

export default function SettingsPageSkeleton() {
  return (
    <div
      className="flex flex-col items-center p-4 gap-6 animate-pulse bg-white/[0.05] border border-[rgba(80,80,80,0.24)] shadow-[inset_0_0_7px_rgba(255,255,255,0.16)] backdrop-blur-[37px] rounded-[16px]"
      style={{
        width: "920px",
        maxHeight: "90vh",
        boxSizing: "border-box",
        paddingRight: "12px",
      }}
    >
      {/* ✨ Title Placeholder */}
      <div className="w-[200px] h-[40px] bg-white/[0.08] rounded-md" />

      {/* 🧱 Input Fields Skeleton */}
      {[...Array(3)].map((_, i) => (
        <div key={i} className="w-[855px] flex flex-col gap-2">
          <div className="w-[180px] h-[18px] bg-white/[0.08] rounded-md" />
          <div className="w-full h-[48px] bg-white/[0.06] border border-white/[0.08] rounded-md shadow-[inset_0_0_6px_rgba(255,255,255,0.1)]" />
        </div>
      ))}

     
      {/* 💾 Save Button Placeholder */}
      <div className="flex justify-start mt-2 w-[855px]">
        <div className="w-[120px] h-[36px] bg-white/[0.08] border border-white/[0.08] rounded-full shadow-[inset_0_0_5px_rgba(255,255,255,0.15)]" />
      </div>
    </div>
  );
}
