import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { content , content_tags} from "@/lib/tables";
import { eq } from "drizzle-orm";
import { authMiddleware } from "@/lib/authMiddleware";
import { CONTENT_STATUS } from "@/lib/enums"; // Assuming this is defined elsewhere

type RouteParams = { params: Promise<{ id: string }> };

// GET /api/content/[id]
export async function GET(req: NextRequest, context: RouteParams) {
  const { id: postId } = await context.params;

  try {
    const [post] = await db.select().from(content).where(eq(content.id, postId));

    if (!post)
      return NextResponse.json({ success: false, error: "Post not found" }, { status: 404 });

    return NextResponse.json({ success: true, post });
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ success: false, error: errorMessage }, { status: 500 });
  }
}

// PUT /api/content/[id] (updated to handle tags but no references)
export async function PUT(req: NextRequest, context: RouteParams) {
  const { id: postId } = await context.params;

  const authResult = await authMiddleware(req, { roles: ["creator", "admin"] });
  if (authResult instanceof Response) return authResult;

  let body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ success: false, error: "Invalid JSON body" }, { status: 400 });
  }

  try {
     /* ----------------------------------
     * 1️⃣ STATUS (VISIBILITY OVERRIDES)
     * ---------------------------------- */

    let status: "draft" | "published" = CONTENT_STATUS.DRAFT;

    // 🔥 If visibility is provided → ALWAYS published
    if (body.visibility) {
      status = CONTENT_STATUS.PUBLISHED;
    } 
    // Otherwise respect explicit status
    else if (body.status) {
      const allowedStatuses = [
        CONTENT_STATUS.DRAFT,
        CONTENT_STATUS.PUBLISHED,
      ];

      if (!allowedStatuses.includes(body.status)) {
        return NextResponse.json(
          { success: false, error: `Invalid status: ${body.status}` },
          { status: 400 }
        );
      }

      status = body.status;
    }

    /* ----------------------------------
     * 2️⃣ VISIBILITY (ONLY WHEN PUBLISHED)
     * ---------------------------------- */

    let visibility: "private" | "public" | undefined;

    if (status === CONTENT_STATUS.PUBLISHED) {
      if (body.visibility) {
        if (body.visibility !== "private" && body.visibility !== "public") {
          return NextResponse.json(
            { success: false, error: `Invalid visibility: ${body.visibility}` },
            { status: 400 }
          );
        }
        visibility = body.visibility;
      } else {
        visibility = "public"; // default
      }
    }

    /* ----------------------------------
     * 3️⃣ UPDATE DATA
     * ---------------------------------- */

    const updateData: any = {
      title: body.title,
      description:
        body.description ||
        (body.title ? body.title.substring(0, 150) + "..." : undefined),
      content_body: body.body || body.content_body,
      content_type: body.content_type || "post",
      status,
      category_id: body.category_id ?? null,
      excalidraw_data: body.excalidraw_data ?? null,
      updated_at: new Date(),
    };

    // ✅ Only store visibility if published
    if (status === CONTENT_STATUS.PUBLISHED) {
      updateData.visibility = visibility;
    }

    // ✅ Update main content record
    const [updatedPost] = await db
      .update(content)
      .set(updateData)
      .where(eq(content.id, postId))
      .returning();

    if (!updatedPost) {
      return NextResponse.json({ success: false, error: "Post not found" }, { status: 404 });
    }

    const contentId = updatedPost.id;

    // ✅ Handle tags (replace old ones)
    if (Array.isArray(body.tag_ids)) {
      // Delete old tag links
      await db.delete(content_tags).where(eq(content_tags.content_id, contentId));

      // Insert new tags if any
      if (body.tag_ids.length > 0) {
        const tagRows = body.tag_ids.map((tagId: string) => ({
          content_id: contentId,
          tag_id: tagId,
        }));
        await db.insert(content_tags).values(tagRows).onConflictDoNothing();
      }
    }

    return NextResponse.json({ success: true, post: updatedPost });
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : "Unknown error";
    console.error("Update post error:", errorMessage);

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
  const { id: postId } = await context.params;

  const authResult = await authMiddleware(req, { roles: ["creator", "admin"] });
  if (authResult instanceof Response) return authResult;

  try {
    const deleted = await db.delete(content).where(eq(content.id, postId)).returning();

    if (!deleted.length)
      return NextResponse.json({ success: false, error: "Post not found" }, { status: 404 });

    return NextResponse.json({ success: true, message: "Post deleted" });
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ success: false, error: errorMessage }, { status: 500 });
  }
}
