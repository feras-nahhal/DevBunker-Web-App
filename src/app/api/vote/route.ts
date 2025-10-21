import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { votes } from "@/lib/tables";
import { eq, and } from "drizzle-orm";
import { authMiddleware } from "@/lib/authMiddleware";
import { VOTE_TYPE } from "@/lib/enums";

// ✅ POST /api/vote — Add or update a vote
export async function POST(req: NextRequest) {
  const authResult = await authMiddleware(req, { roles: ["consumer", "creator", "admin"] });
  if (authResult instanceof Response) return authResult;

  const user = authResult;
  let body;

  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ success: false, error: "Invalid JSON body" }, { status: 400 });
  }

  const { content_id, vote_type } = body;

  if (!content_id || !vote_type) {
    return NextResponse.json({ success: false, error: "Missing content_id or vote_type" }, { status: 400 });
  }

  if (![VOTE_TYPE.LIKE, VOTE_TYPE.DISLIKE].includes(vote_type)) {
    return NextResponse.json({ success: false, error: "Invalid vote type" }, { status: 400 });
  }

  try {
    // Check if user already voteds
    const existing = await db
      .select()
      .from(votes)
      .where(and(eq(votes.user_id, user.id), eq(votes.content_id, content_id)));

    if (existing.length > 0) {
      const currentVote = existing[0];

      // 🟡 Toggle off if user clicked same vote again
      if (currentVote.vote_type === vote_type) {
        await db.delete(votes).where(eq(votes.id, currentVote.id));
        return NextResponse.json({ success: true, message: "Vote removed" });
      }

      // 🟢 Switch vote type
      await db
        .update(votes)
        .set({ vote_type, updated_at: new Date() })
        .where(eq(votes.id, currentVote.id));

      return NextResponse.json({ success: true, message: "Vote updated" });
    }

    // 🟢 Add new vote
    await db.insert(votes).values({
      user_id: user.id,
      content_id,
      vote_type,
    });

    return NextResponse.json({ success: true, message: "Vote added" });
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : "Unknown error";
    console.error("Vote error:", errorMessage);
    return NextResponse.json({ success: false, error: errorMessage }, { status: 500 });
  }
}


// ✅ GET /api/vote?content_id=...
export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const contentId = url.searchParams.get("content_id");

    if (!contentId) {
      return NextResponse.json({ success: false, error: "Missing content_id" }, { status: 400 });
    }

    const likeVotes = await db
      .select()
      .from(votes)
      .where(and(eq(votes.content_id, contentId), eq(votes.vote_type, VOTE_TYPE.LIKE)));

    const dislikeVotes = await db
      .select()
      .from(votes)
      .where(and(eq(votes.content_id, contentId), eq(votes.vote_type, VOTE_TYPE.DISLIKE)));

    return NextResponse.json({
      success: true,
      likes: likeVotes.length,
      dislikes: dislikeVotes.length,
    });
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : "Unknown error";
    console.error("Fetch votes error:", errorMessage);
    return NextResponse.json({ success: false, error: errorMessage }, { status: 500 });
  }
}
