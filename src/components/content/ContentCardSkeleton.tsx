// components/ContentCardSkeleton.tsx
export default function ContentCardSkeleton() {
  return (
    <div className="flex flex-col items-center bg-white/[0.05] border border-[rgba(80,80,80,0.24)] shadow-[inset_0px_0px_7px_rgba(255,255,255,0.16)] rounded-[16px] overflow-hidden animate-pulse"
         style={{ width: "325px", height: "567px", padding: "8px", gap: "4px" }}>
      {/* Header */}
      <div className="flex flex-row justify-between items-start w-full h-[66px] px-4 pt-4 gap-[16px]">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-full bg-white/10" />
          <div className="flex flex-col gap-2">
            <div className="w-20 h-4 bg-white/10 rounded" />
            <div className="w-12 h-3 bg-white/10 rounded" />
          </div>
        </div>
        <div className="w-6 h-6 bg-white/10 rounded" />
      </div>

      {/* Image */}
      <div className="mt-2 w-[290px] h-[216px] bg-white/10 rounded-lg" />

      {/* Bottom Section */}
      <div className="flex flex-col mt-4 p-[17px_20px] gap-2 w-[297px] h-[265px] bg-white/[0.05] rounded-[16px]">
        <div className="w-20 h-8 bg-white/10 rounded-full mb-2" />
        <div className="w-full h-6 bg-white/10 rounded mb-2" />
        <div className="w-5/6 h-4 bg-white/10 rounded mb-1" />
        <div className="flex gap-2 mt-auto">
          <div className="w-10 h-6 bg-white/10 rounded" />
          <div className="w-10 h-6 bg-white/10 rounded" />
          <div className="w-12 h-6 bg-white/10 rounded" />
        </div>
      </div>
    </div>
  );
}
