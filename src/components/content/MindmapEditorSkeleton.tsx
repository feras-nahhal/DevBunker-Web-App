export default function MindmapEditorSkeleton() {
  return (
    <div className="flex flex-col gap-6 w-full max-w-5xl mx-auto mt-10 animate-pulse">
      {/* 🧰 Toolbar Placeholder */}
      <div className="flex items-center gap-3 p-3 rounded-lg bg-white/10 border border-white/10 shadow-[inset_0_0_6px_rgba(255,255,255,0.08)]">
        <div className="w-24 h-8 rounded-md bg-white/10 border border-white/10" />
        <div className="w-20 h-8 rounded-md bg-white/10 border border-white/10" />
        <div className="w-20 h-8 rounded-md bg-white/10 border border-white/10" />
        <div className="w-8 h-8 rounded-md bg-white/10 border border-white/10 ml-auto" />
      </div>

      {/* 🧠 Mindmap Canvas Area */}
      <div className="relative h-[500px] rounded-lg bg-white/10 border border-white/10 shadow-[inset_0_0_8px_rgba(255,255,255,0.08)] overflow-hidden">
        {/* ✳️ Background Texture */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.03)_0%,rgba(0,0,0,0.15)_100%)]" />

        {/* 🔵 Circle Node */}
        <div className="absolute top-[25%] left-[20%] w-16 h-16 rounded-full bg-white/10 border border-white/10 shadow-[inset_0_0_8px_rgba(255,255,255,0.1)]" />

        {/* 💎 Diamond Node */}
        <div className="absolute top-[45%] left-[45%] w-16 h-16 bg-white/10 border border-white/10 shadow-[inset_0_0_8px_rgba(255,255,255,0.1)] rotate-45" />

        {/* ⚪ Rectangle Node */}
        <div className="absolute bottom-[30%] right-[25%] w-32 h-12 rounded-md bg-white/10 border border-white/10 shadow-[inset_0_0_8px_rgba(255,255,255,0.1)]" />


      </div>

      {/* ✨ Bottom Glow Accent */}
      <div className="relative w-full h-[1px] overflow-hidden rounded-full mt-2">
        <span className="absolute inset-x-0 bottom-0 h-[120%] bg-[radial-gradient(circle_at_bottom,rgba(91,228,155,0.4)_0%,transparent_80%)] blur-[20px]" />
      </div>
    </div>
  );
}
