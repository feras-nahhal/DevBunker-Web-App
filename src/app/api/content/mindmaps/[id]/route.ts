import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { content, content_tags } from "@/lib/tables";
import { eq } from "drizzle-orm";
import { authMiddleware } from "@/lib/authMiddleware";
import { CONTENT_STATUS } from "@/lib/enums";

type RouteParams = { params: Promise<{ id: string }> };

// GET /api/content/[id]
export async function GET(req: NextRequest, context: RouteParams) {
  const { id: mindmapId } = await context.params;

  try {
    const [mindmap] = await db.select().from(content).where(eq(content.id, mindmapId));

    if (!mindmap) {
      return NextResponse.json({ success: false, error: "Mindmap not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, mindmap });
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ success: false, error: errorMessage }, { status: 500 });
  }
}

// PUT /api/content/[id]
export async function PUT(req: NextRequest, context: RouteParams) {
  const { id: mindmapId } = await context.params;

  const authResponse = await authMiddleware(req, { roles: ["creator", "admin"] });
  if (authResponse instanceof Response) return authResponse;

  let body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ success: false, error: "Invalid JSON body" }, { status: 400 });
  }

  try {
    // ✅ Validate status
    let status: string = CONTENT_STATUS.DRAFT;
    if (body.status) {
      const allowedStatuses = [CONTENT_STATUS.DRAFT, CONTENT_STATUS.PUBLISHED];
      if (!allowedStatuses.includes(body.status)) {
        return NextResponse.json(
          { success: false, error: `Invalid status: ${body.status}` },
          { status: 400 }
        );
      }
      status = body.status;
    }

    // ✅ Prepare update data
    const updateData = {
      title: body.title,
      content_body: body.content_body || (body.title ? body.title.substring(0, 150) + "..." : null),
      excalidraw_data: body.excalidraw_data || null,
      category_id: body.category_id || null,
      status,
      updated_at: new Date(),
    };

    // ✅ Update main mindmap record
    const [updatedMindmap] = await db
      .update(content)
      .set(updateData)
      .where(eq(content.id, mindmapId))
      .returning();

    if (!updatedMindmap) {
      return NextResponse.json({ success: false, error: "Mindmap not found" }, { status: 404 });
    }

    // ✅ Handle tags
    if (Array.isArray(body.tag_ids)) {
      await db.delete(content_tags).where(eq(content_tags.content_id, updatedMindmap.id));

      if (body.tag_ids.length > 0) {
        const tagRows = body.tag_ids.map((tagId: string) => ({
          content_id: updatedMindmap.id,
          tag_id: tagId,
        }));
        await db.insert(content_tags).values(tagRows).onConflictDoNothing();
      }
    }

    return NextResponse.json({ success: true, mindmap: updatedMindmap });
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : "Unknown error";
    console.error("Update mindmap error:", errorMessage);

    if (errorMessage.includes("foreign key")) {
      return NextResponse.json(
        { success: false, error: "Invalid category_id, tag_id, or author_id." },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: false, error: errorMessage }, { status: 500 });
  }
}

// DELETE /api/content/[id]
export async function DELETE(req: NextRequest, context: RouteParams) {
  const { id: mindmapId } = await context.params;

  const authResponse = await authMiddleware(req, { roles: ["creator", "admin"] });
  if (authResponse instanceof Response) return authResponse;

  try {
    const deleted = await db.delete(content).where(eq(content.id, mindmapId)).returning();

    if (!deleted.length) {
      return NextResponse.json({ success: false, error: "Mindmap not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: "Mindmap deleted" });
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ success: false, error: errorMessage }, { status: 500 });
  }
}
