import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { comments, users } from "@/lib/tables";
import { eq, isNull, sql } from "drizzle-orm";
import { authMiddleware } from "@/lib/authMiddleware";

// 🟢 GET: Fetch comments (and nested replies) for a content item
export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const contentId = url.searchParams.get("content_id");

    if (!contentId) {
      return NextResponse.json(
        { success: false, error: "Missing content_id parameter" },
        { status: 400 }
      );
    }

    // Fetch all comments for that content
    const allComments = await db
      .select({
        id: comments.id,
        text: comments.text,
        parent_id: comments.parent_id,
        created_at: comments.created_at,
        user_id: comments.user_id,
        authorEmail: users.email,
      })
      .from(comments)
      .leftJoin(users, eq(comments.user_id, users.id))
      .where(eq(comments.content_id, contentId))
      .orderBy(comments.created_at);

    // Group comments into nested structure
    const commentMap: Record<string, any> = {};
    const rootComments: any[] = [];

    allComments.forEach((comment) => {
      commentMap[comment.id] = { ...comment, replies: [] };
    });

    allComments.forEach((comment) => {
      if (comment.parent_id) {
        commentMap[comment.parent_id]?.replies.push(commentMap[comment.id]);
      } else {
        rootComments.push(commentMap[comment.id]);
      }
    });

    return NextResponse.json({ success: true, comments: rootComments });
  } catch (err: unknown) {
    console.error("Fetch comments error:", err);
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 }
    );
  }
}

// 🟢 POST: Add a comment or reply
export async function POST(req: NextRequest) {
  const authResult = await authMiddleware(req, { roles: ["consumer", "creator", "admin"] });
  if (authResult instanceof Response) return authResult;

  const user = authResult;
  const { content_id, text, parent_id } = await req.json();

  if (!content_id || !text) {
    return NextResponse.json(
      { success: false, error: "content_id and text are required" },
      { status: 400 }
    );
  }

  try {
    const [newComment] = await db
      .insert(comments)
      .values({
        content_id,
        user_id: user.id,
        text,
        parent_id: parent_id || null,
      })
      .returning();

    return NextResponse.json({ success: true, comment: newComment });
  } catch (err: unknown) {
    console.error("Add comment error:", err);
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 }
    );
  }
}
