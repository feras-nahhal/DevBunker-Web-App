// components/DraftCardSkeleton.tsx
export default function DraftCardSkeleton() {
  return (
    <div
      className="flex items-center justify-center animate-pulse"
      style={{ width: "330px", height: "402.64px", padding: "8px", gap: "4px" }}
    >
      <div
        className="relative flex flex-col items-center bg-white/[0.05] border border-[rgba(80,80,80,0.24)]
        shadow-[inset_0px_0px_7px_rgba(255,255,255,0.16)] rounded-[16px] overflow-hidden w-full h-full"
      >
        {/* Header */}
        <div className="flex justify-between items-start w-full px-3 pt-2 h-[30px]">
          <div className="flex flex-col gap-1 w-[100px]">
            <div className="w-full h-3 bg-white/10 rounded" />
            <div className="w-2/3 h-2 bg-white/10 rounded" />
          </div>
          <div className="w-6 h-6 bg-white/10 rounded" />
        </div>

        {/* Image */}
        <div className="mt-2 w-[290px] h-[216px] bg-white/10 rounded-lg" />

        {/* Bottom Box */}
        <div
          className="flex flex-col items-start mt-4 bg-white/[0.05] rounded-[16px] p-[17px_10px] gap-3 w-[300px] h-[166px]"
        >
          <div className="w-[58px] h-[28px] bg-white/10 rounded-full" />
          <div className="w-full h-6 bg-white/10 rounded" />
          <div className="w-5/6 h-4 bg-white/10 rounded" />
          <div className="flex gap-2 mt-auto">
            <div className="w-20 h-6 bg-white/10 rounded" />
            <div className="w-20 h-6 bg-white/10 rounded" />
          </div>
        </div>
      </div>
    </div>
  );
}
