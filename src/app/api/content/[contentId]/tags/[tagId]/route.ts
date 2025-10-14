import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { content, tags, content_tags } from "@/lib/tables";
import { eq, and } from "drizzle-orm";
import { authMiddleware } from "@/lib/authMiddleware";

type RouteParams = { params: Promise<{ contentId: string; tagId: string }> };

// Helper: Validate content exists
async function validateContent(contentId: string) {
  const [existing] = await db.select().from(content).where(eq(content.id, contentId));
  if (!existing) throw new Error("Content not found");
}

// DELETE /api/content/[contentId]/tags/[tagId] - Remove tag association
export async function DELETE(req: NextRequest, context: RouteParams) {
  const { contentId, tagId } = await context.params;

  const authResult = await authMiddleware(req, { roles: ["creator", "admin"] });
  if (authResult instanceof Response) return authResult;

  try {
    await validateContent(contentId);

    // Delete association
    const [deleted] = await db
      .delete(content_tags)
      .where(and(eq(content_tags.content_id, contentId), eq(content_tags.tag_id, tagId)))
      .returning();

    if (!deleted) {
      return NextResponse.json({ success: false, error: "Association not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : "Unknown error";
    console.error("Delete content tag error:", errorMessage);
    return NextResponse.json({ success: false, error: errorMessage }, { status: 500 });
  }
}