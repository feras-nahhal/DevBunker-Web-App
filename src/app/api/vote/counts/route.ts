import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { votes } from "@/lib/tables";
import { inArray, count, eq, and } from "drizzle-orm";
import { VOTE_TYPE } from "@/lib/enums";

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const idsParam = url.searchParams.get("content_ids"); // comma separated list

  if (!idsParam) {
    return NextResponse.json(
      { success: false, error: "Missing content_ids" },
      { status: 400 }
    );
  }

  const contentIds = idsParam.split(",");

  try {
    // Get all votes grouped by content_id and vote_type
    const results = await db
      .select({
        content_id: votes.content_id,
        vote_type: votes.vote_type,
        count: count(votes.id).as("count"),
      })
      .from(votes)
      .where(inArray(votes.content_id, contentIds))
      .groupBy(votes.content_id, votes.vote_type);

    // Build map like { contentId: { likes: n, dislikes: m } }
    const countsMap: Record<string, { likes: number; dislikes: number }> = {};

    // Initialize all counts
    contentIds.forEach((id) => {
      countsMap[id] = { likes: 0, dislikes: 0 };
    });

    results.forEach((r) => {
      if (!r.content_id) return; // skip null
      const id = r.content_id as string;
      if (!countsMap[id]) countsMap[id] = { likes: 0, dislikes: 0 };

      if (r.vote_type === VOTE_TYPE.LIKE) countsMap[id].likes = Number(r.count);
      else if (r.vote_type === VOTE_TYPE.DISLIKE)
        countsMap[id].dislikes = Number(r.count);
    });

    return NextResponse.json({ success: true, counts: countsMap });
  } catch (err) {
    console.error("Fetch vote counts error:", err);
    return NextResponse.json(
      {
        success: false,
        error: err instanceof Error ? err.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
