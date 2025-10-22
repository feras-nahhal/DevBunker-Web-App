export default function CreatePostSkeleton() {
  return (
    <div className="flex flex-col gap-6 w-full max-w-3xl mx-auto mt-10 animate-pulse">
      {/* 🟦 Title Input */}
      <div className="h-12 rounded-lg bg-white/10 border border-white/10 shadow-[inset_0_0_6px_rgba(255,255,255,0.08)]" />

      {/* 🟩 Content Body */}
      <div className="h-[400px] rounded-lg bg-white/10 border border-white/10 shadow-[inset_0_0_6px_rgba(255,255,255,0.08)]" />

      {/* 🟨 Buttons (Vertical Stack) */}
      <div className="flex flex-col gap-3 w-[200px]">
        <div className="h-10 rounded-md bg-white/10 border border-white/10 shadow-[inset_0_0_4px_rgba(255,255,255,0.08)]" />
        <div className="h-10 rounded-md bg-white/10 border border-white/10 shadow-[inset_0_0_4px_rgba(255,255,255,0.08)]" />
      </div>

      {/* ✳️ Bottom Glow for Style */}
      <div className="relative w-full h-[1px] overflow-hidden rounded-full mt-2">
        <span className="absolute inset-x-0 bottom-0 h-[120%] bg-[radial-gradient(circle_at_bottom,rgba(91,228,155,0.4)_0%,transparent_80%)] blur-[20px]" />
      </div>
    </div>
  );
}
