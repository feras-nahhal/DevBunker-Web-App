import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { content_tags, tags } from "@/lib/tables";
import { eq } from "drizzle-orm";

// GET — Fetch all tags linked to a content item
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const contentId = searchParams.get("contentId");

    if (!contentId) {
      return NextResponse.json(
        { success: false, message: "Missing content ID" },
        { status: 400 }
      );
    }

    const tagList = await db
      .select({
        id: tags.id,
        name: tags.name,
        status: tags.status,
        created_at: tags.created_at,
      })
      .from(content_tags)
      .innerJoin(tags, eq(content_tags.tag_id, tags.id))
      .where(eq(content_tags.content_id, contentId));

    return NextResponse.json({ success: true, tags: tagList });
  } catch (error) {
    console.error("Error fetching content tags:", error);
    return NextResponse.json(
      { success: false, message: "Server error fetching tags" },
      { status: 500 }
    );
  }
}
