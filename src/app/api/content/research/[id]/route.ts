import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { content, content_tags, references_link } from "@/lib/tables";
import { eq } from "drizzle-orm";
import { authMiddleware } from "@/lib/authMiddleware";
import { CONTENT_STATUS } from "@/lib/enums"; // Assuming this is defined elsewhere

type RouteParams = { params: Promise<{ id: string }> };

// GET /api/content/research/[id]
export async function GET(req: NextRequest, context: RouteParams) {
  const { id: researchId } = await context.params;

  try {
    const [research] = await db.select().from(content).where(eq(content.id, researchId));

    if (!research) {
      return NextResponse.json({ success: false, error: "Research not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, research });
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ success: false, error: errorMessage }, { status: 500 });
  }
}

// PUT /api/content/research/[id] (updated to handle tags and references like POST)
export async function PUT(req: NextRequest, context: RouteParams) {
  const { id: researchId } = await context.params;

  const authResult = await authMiddleware(req, { roles: ["creator", "admin"] });
  if (authResult instanceof Response) return authResult;

  const user = authResult;
  let body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ success: false, error: "Invalid JSON body" }, { status: 400 });
  }

  try {
    // ✅ Validate and normalize status (same as POST)
    let status: string = CONTENT_STATUS.DRAFT;
    if (body.status) {
      const allowedStatuses = [CONTENT_STATUS.DRAFT, CONTENT_STATUS.PENDING_APPROVAL];
      if (!allowedStatuses.includes(body.status)) {
        return NextResponse.json(
          { success: false, error: `Invalid status: ${body.status}` },
          { status: 400 }
        );
      }
      status = body.status;
    }

    // ✅ Validate references (same as POST: array of non-empty strings)
    let references: string[] = [];
    if (body.references) {
      if (!Array.isArray(body.references)) {
        return NextResponse.json(
          { success: false, error: "References must be an array of strings" },
          { status: 400 }
        );
      }
      references = body.references.filter((ref: string) => ref && typeof ref === "string" && ref.trim().length > 0);
      if (references.length !== body.references.length) {
        console.warn("Filtered invalid/empty references");
      }
    }

    // ✅ Prepare update data for content (research-specific, excluding tags/references)
    const updateData = {
      title: body.title,
      description: body.description || (body.title ? body.title.substring(0, 150) + "..." : undefined),
      content_body: body.body || body.content_body,
      content_type: "research", // Ensure it stays as research
      status,
      category_id: body.category_id || null,
      excalidraw_data: body.excalidraw_data || null, // Optional; remove if not needed for research
      updated_at: new Date(),
      // Note: author_id is not updated (typically set on create)
    };

    // ✅ Update research content
    const [updatedResearch] = await db.update(content).set(updateData).where(eq(content.id, researchId)).returning();

    if (!updatedResearch) {
      return NextResponse.json({ success: false, error: "Research not found" }, { status: 404 });
    }

    const contentId = updatedResearch.id;

    // ✅ Handle tags: Delete existing, then insert new (to replace fully)
    if (Array.isArray(body.tag_ids)) {
      // Delete existing tags for this content
      await db.delete(content_tags).where(eq(content_tags.content_id, contentId));

      // Insert new tags if provided
      if (body.tag_ids.length > 0) {
        const tagRows = body.tag_ids.map((tagId: string) => ({
          content_id: contentId,
          tag_id: tagId,
        }));
        await db.insert(content_tags).values(tagRows).onConflictDoNothing(); // Avoid duplicates
      }
    }

    // ✅ Handle references: Delete existing, then insert new (to replace fully)
    if (references.length > 0 || body.references) { // Allow clearing by passing empty array
      // Delete existing references for this content
      await db.delete(references_link).where(eq(references_link.content_id, contentId));

      // Insert new references if provided
      if (references.length > 0) {
        const referenceRows = references.map((text: string) => ({
          content_id: contentId,
          text: text.trim(), // Store trimmed text
          user_id: user.id, // Link to updater (or creator; adjust if needed)
          created_at: new Date(), // Auto-timestamp
        }));
        await db.insert(references_link).values(referenceRows).onConflictDoNothing(); // Avoid duplicates (e.g., by unique text/content_id if schema has constraint)
      }
    }

    return NextResponse.json({ success: true, research: updatedResearch });
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : "Unknown error";
    console.error("Update research error:", errorMessage);

    if (errorMessage.includes("foreign key")) {
      return NextResponse.json(
        { success: false, error: "Invalid category_id, tag_id, or author_id." },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: false, error: errorMessage }, { status: 500 });
  }
}


// DELETE /api/content/research/[id]
export async function DELETE(req: NextRequest, context: RouteParams) {
  const { id: researchId } = await context.params;

  const authResult = await authMiddleware(req, { roles: ["creator", "admin"] });
  if (authResult instanceof Response) return authResult;

  try {
    const deleted = await db.delete(content).where(eq(content.id, researchId)).returning();

    if (!deleted.length) {
      return NextResponse.json({ success: false, error: "Research not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: "Research deleted" });
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ success: false, error: errorMessage }, { status: 500 });
  }
}
