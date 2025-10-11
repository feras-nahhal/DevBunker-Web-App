"use client";

import DraftCard from "./DraftCard";
import { useContent } from "@/hooks/useContent";
import { useMemo } from "react";

interface ContentGridProps {
  type?: "all" | "post" | "research" | "mindmap";
}

export default function DraftGrid({ type = "all" }: ContentGridProps) {
  // 👇 prevent filters object from being recreated every render
  const filters = useMemo(() => ({ status: "draft" }), []);

  const { data, loading, error } = useContent({ type, filters });

  if (loading)
    return (
      <div className="flex justify-center py-10 text-gray-400 text-lg">
        Loading content...
      </div>
    );

  if (error)
    return (
      <div className="flex justify-center py-10 text-red-500">
        Error: {error}
      </div>
    );

  if (!data.length)
    return (
      <div className="flex justify-center py-10 text-gray-400">
        No {type === "all" ? "content" : type} available.
      </div>
    );

  return (
    <div
      className="
        grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4
        gap-x-[2px] gap-y-[-10px]
        place-items-center
      "
      style={{
        width: "100%",
        maxWidth: "1429px",
        margin: "0 auto",
        overflowX: "hidden",
        boxSizing: "border-box",
      }}
    >
      {data.map((card) => (
        <div
          key={card.id}
          style={{
            width: "360px",
            transform: "scale(0.9)",
            transformOrigin: "top center",
          }}
        >
          <DraftCard
            {...card}
            type={card.content_type as "post" | "mindmap" | "research"}
          />
        </div>
      ))}
    </div>
  );
}
