import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { references_link, users } from "@/lib/tables";
import { eq, sql } from "drizzle-orm";

type FlatReference = {
  id: string;
  text: string;
  created_at: Date | null;
  user_id: string;
  authorEmail: string | null;
};

// 🟢 GET: Fetch references for a content item OR unique reference texts for filter
export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const contentId = url.searchParams.get("content_id");

    if (contentId) {
      // 🟢 Existing: Fetch references for a specific content item
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
    } else {
      // 🆕 NEW: Fetch unique reference texts from all content (for filter dropdown)
      const uniqueRefs = await db
        .select({ text: references_link.text })
        .from(references_link)
        .where(sql`${references_link.text} IS NOT NULL AND ${references_link.text} != ''`)
        .groupBy(references_link.text)
        .orderBy(references_link.text);

      const referenceTexts = uniqueRefs.map((r) => r.text).filter(Boolean);
      return NextResponse.json({ success: true, references: referenceTexts });
    }
  } catch (err: unknown) {
    console.error("Fetch references error:", err);
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 }
    );
  }
}