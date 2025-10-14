import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { references_link, users } from "@/lib/tables";
import { eq } from "drizzle-orm";
import { authMiddleware } from "@/lib/authMiddleware";

type FlatReference = {
  id: string;
  text: string;
  created_at: Date | null;
  user_id: string;
  authorEmail: string | null;
};

// 🟢 GET: Fetch references for a content item
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

    // Fetch all references for that content
    const allReferences: FlatReference[] = await db
      .select({
        id: references_link.id,
        text: references_link.text,
        created_at: references_link.created_at,
        user_id: references_link.user_id,
        authorEmail: users.email,
      })
      .from(references_link)
      .leftJoin(users, eq(references_link.user_id, users.id))
      .where(eq(references_link.content_id, contentId))
      .orderBy(references_link.created_at);

    return NextResponse.json({ success: true, references: allReferences });
  } catch (err: unknown) {
    console.error("Fetch references error:", err);
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 }
    );
  }
}

// 🟢 POST: Add a reference
export async function POST(req: NextRequest) {
  const authResult = await authMiddleware(req, { roles: ["consumer", "creator", "admin"] });
  if (authResult instanceof Response) return authResult;

  const user = authResult;
  const { content_id, text } = await req.json();

  if (!content_id || !text) {
    return NextResponse.json(
      { success: false, error: "content_id and text are required" },
      { status: 400 }
    );
  }

  try {
    const [newReference] = await db
      .insert(references_link)
      .values({
        content_id,
        user_id: user.id,
        text,
      })
      .returning();

    return NextResponse.json({ success: true, reference: newReference });
  } catch (err: unknown) {
    console.error("Add reference error:", err);
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 }
    );
  }
}