import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { comments } from "@/lib/tables";
import { eq, inArray, count } from "drizzle-orm";

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const idsParam = url.searchParams.get("content_ids"); // comma separated
  if (!idsParam) {
    return NextResponse.json({ success: false, error: "Missing content_ids" }, { status: 400 });
  }

  const contentIds = idsParam.split(",");

  try {
    const results = await db
      .select({
        content_id: comments.content_id,
        comment_count: count(comments.id).as("comment_count"), // ✅ Drizzle count
      })
      .from(comments)
      .where(inArray(comments.content_id, contentIds))
      .groupBy(comments.content_id);

    const countsMap: Record<string, number> = {};
    results.forEach((r) => {
      countsMap[r.content_id] = Number(r.comment_count);
    });

    return NextResponse.json({ success: true, counts: countsMap });
  } catch (err) {
    console.error("Fetch comment counts error:", err);
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 }
    );
  }
}
