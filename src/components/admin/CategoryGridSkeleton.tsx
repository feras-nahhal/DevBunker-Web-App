"use client";

export default function CategoryGridSkeleton() {
  const rows = Array(5).fill(0); // Show 5 skeleton rows (same as itemsPerPage default)

  return (
    <div
      className="flex flex-col items-center justify-start mx-auto animate-pulse"
      style={{
        width: "1200px",
        backgroundColor: "rgba(255,255,255,0.05)",
        borderRadius: "10px",
        border: "1px solid rgba(80,80,80,0.24)",
        boxShadow: "inset 0 0 7px rgba(255,255,255,0.16)",
        backdropFilter: "blur(12px)",
        overflow: "hidden",
      }}
    >
      {/* Stats Summary Skeleton */}
      <div className="flex flex-wrap gap-4 w-full px-5 py-4 border-b border-[rgba(145,158,171,0.2)] bg-white/[0.05]">
        {Array(4).fill(0).map((_, i) => (
          <div key={i} className="flex items-center gap-2">
            <div className="w-12 h-3 bg-gray-500/40 rounded" />
            <div className="w-6 h-6 bg-gray-500/30 rounded-md" />
          </div>
        ))}
      </div>

      {/* Search & Filters Skeleton */}
      <div className="w-full border-b border-[rgba(145,158,171,0.2)] bg-white/[0.05] px-5 py-4">
        {/* Top Row: Search + Filters */}
        <div className="flex flex-wrap items-end gap-3 mb-3">
          <div className="flex-1 min-w-[200px]">
            <div className="w-full h-10 bg-gray-500/30 rounded-md" />
          </div>
          <div className="w-[220px]">
            <div className="w-full h-8 bg-gray-500/30 rounded-md mb-1" />
            <div className="w-full h-8 bg-gray-500/40 rounded-md" />
          </div>
        </div>
        {/* Bottom Row: Pills + Clear Button */}
        <div className="flex gap-3">
          <div className="w-[225px] h-10 bg-gray-500/30 rounded-md" />
          <div className="w-16 h-6 bg-gray-500/40 rounded" />
        </div>
      </div>

      {/* Header row (labels placeholder) */}
      <div
        className="relative flex flex-row items-center justify-between border-b border-[rgba(145,158,171,0.2)]"
        style={{
          width: "100%",
          height: "76px",
          padding: "16px",
        }}
      >
        <div className="w-5 h-5 rounded-lg bg-gray-500/30" />
        <div className="flex flex-row items-center flex-1 gap-12 min-w-0">
          <div className="w-10 h-10 rounded-full bg-gray-500/30" />
          <div className="flex w-[235px] flex-col items-start shrink-0 gap-2">
            <div className="w-28 h-3 bg-gray-500/40 rounded" />
            <div className="w-20 h-2 bg-gray-500/30 rounded" />
          </div>
          <div className="flex flex-row gap-[120px] flex-1 min-w-0 items-center">
            <div className="w-24 h-3 bg-gray-500/40 rounded" />
            <div className="w-20 h-3 bg-gray-500/30 rounded" />
            <div className="w-32 h-3 bg-gray-500/30 rounded" />
          </div>
        </div>
      </div>

      {/* Placeholder rows for loading cards */}
      {rows.map((_, i) => (
        <div
          key={i}
          className="relative flex flex-row items-center justify-between border-b border-[rgba(145,158,171,0.2)]"
          style={{
            width: "100%",
            height: "76px",
            padding: "16px",
            background: "transparent",
          }}
        >
          {/* Checkbox + Avatar */}
          <div className="flex items-center gap-3 shrink-0 ml-2">
            <div className="w-5 h-5 rounded-lg bg-gray-500/30" />
            <div className="w-10 h-10 rounded-full bg-gray-500/40" />
          </div>

          {/* Main content placeholders */}
          <div className="flex flex-row items-center flex-1 gap-12 min-w-0">
            <div className="flex w-[235px] flex-col items-start gap-2 shrink-0">
              <div className="w-40 h-3 bg-gray-500/40 rounded" />
              <div className="w-32 h-2 bg-gray-500/30 rounded" />
            </div>

            <div className="flex flex-row gap-[120px] flex-1 min-w-0 items-center">
              <div className="w-24 h-3 bg-gray-500/40 rounded" />
              <div className="w-28 h-3 bg-gray-500/30 rounded" />
              <div className="w-24 h-3 bg-gray-500/30 rounded" />
            </div>
          </div>

          {/* Right-side buttons placeholder */}
          <div className="flex items-center gap-2 mr-4">
            <div className="w-16 h-5 rounded-full bg-gray-500/30" />
            <div className="w-16 h-5 rounded-full bg-gray-500/20" />
          </div>
        </div>
      ))}

      {/* Footer Skeleton */}
      <div className="flex items-center justify-between w-full border-t border-[rgba(145,158,171,0.2)] py-3 px-5 bg-white/[0.05]">
        {/* Bulk Actions Skeleton */}
        <div className="flex items-center gap-3">
          <div className="w-32 h-4 bg-gray-500/30 rounded" />
          <div className="w-32 h-8 bg-gray-500/40 rounded-full" />
          <div className="w-32 h-8 bg-gray-500/40 rounded-full" />
          <div className="w-32 h-8 bg-gray-500/40 rounded-full" />
        </div>

        {/* Pagination Skeleton */}
        <div className="flex items-center gap-3">
          <div className="w-24 h-4 bg-gray-500/30 rounded" />
          <div className="w-12 h-6 bg-gray-500/40 rounded-full" />
          <div className="w-20 h-4 bg-gray-500/30 rounded" />
          <div className="flex gap-2">
            <div className="w-8 h-8 bg-gray-500/40 rounded" />
            <div className="w-8 h-8 bg-gray-500/40 rounded" />
            <div className="w-8 h-8 bg-gray-500/40 rounded" />
            <div className="w-8 h-8 bg-gray-500/40 rounded" />
          </div>
        </div>
      </div>
    </div>
  );
}
