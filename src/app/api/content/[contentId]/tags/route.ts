import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { content, tags, content_tags } from "@/lib/tables";
import { eq, and } from "drizzle-orm";
import { authMiddleware } from "@/lib/authMiddleware";

type RouteParams = { params: Promise<{ contentId: string }> };

// Helper: Validate content exists
async function validateContent(contentId: string) {
  const [existing] = await db.select().from(content).where(eq(content.id, contentId));
  if (!existing) throw new Error("Content not found");
}

// Helper: Validate tag exists
async function validateTag(tagId: string) {
  const [existing] = await db.select().from(tags).where(eq(tags.id, tagId));
  if (!existing) throw new Error("Tag not found");
}

// GET /api/content/[contentId]/tags - Get tag names (and IDs) for contentId
export async function GET(req: NextRequest, context: RouteParams) {
  const { contentId } = await context.params;

  try {
    // Optional auth (uncomment if needed)
    // const authResult = await authMiddleware(req);
    // if (authResult instanceof Response) return authResult;

    await validateContent(contentId);

    // Fetch tag names/IDs (join content_tags with tags)
    const tagsForContent = await db
      .select({
        id: tags.id,
        name: tags.name,
      })
      .from(content_tags)
      .innerJoin(tags, eq(content_tags.tag_id, tags.id))
      .where(eq(content_tags.content_id, contentId))
      .orderBy(tags.name);

    return NextResponse.json({ success: true, tags: tagsForContent });
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : "Unknown error";
    console.error("Get content tags error:", errorMessage);
    return NextResponse.json({ success: false, error: errorMessage }, { status: 500 });
  }
}

// POST /api/content/[contentId]/tags - Add tag association
export async function POST(req: NextRequest, context: RouteParams) {
  const { contentId } = await context.params;

  const authResult = await authMiddleware(req, { roles: ["creator", "admin"] });
  if (authResult instanceof Response) return authResult;

  let body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ success: false, error: "Invalid JSON" }, { status: 400 });
  }

  const { tagId } = body;
  if (!tagId) return NextResponse.json({ success: false, error: "tagId required" }, { status: 400 });

  try {
    await validateContent(contentId);
    await validateTag(tagId);

    // Prevent duplicate
    const [existing] = await db
      .select()
      .from(content_tags)
      .where(and(eq(content_tags.content_id, contentId), eq(content_tags.tag_id, tagId)));
    if (existing) {
      return NextResponse.json({ success: false, error: "Tag already associated" }, { status: 409 });
    }

    // Insert association
    await db.insert(content_tags).values({ content_id: contentId, tag_id: tagId });

    // Return the added tag (id + name)
    const [addedTag] = await db
      .select({ id: tags.id, name: tags.name })
      .from(content_tags)
      .innerJoin(tags, eq(content_tags.tag_id, tags.id))
      .where(and(eq(content_tags.content_id, contentId), eq(content_tags.tag_id, tagId)));

    return NextResponse.json({ success: true, tag: addedTag }, { status: 201 });
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : "Unknown error";
    console.error("Add content tag error:", errorMessage);
    return NextResponse.json({ success: false, error: errorMessage }, { status: 500 });
  }
}