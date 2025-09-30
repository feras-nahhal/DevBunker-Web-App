// src/app/api/admin/tags/[id]/reject/route.ts
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { tags, tag_requests, content_tags } from "@/lib/tables";
import { authMiddleware } from "@/lib/authMiddleware";
import { eq } from "drizzle-orm";

// PUT /admin/tags/[id]/reject
export async function PUT(req: Request, { params }: { params: { id: string } }) {
  const authResult = await authMiddleware(req, { roles: ["admin"] });
  if (authResult instanceof Response) return authResult;

  try {
    // 1. Mark the request as rejected
    const [request] = await db.update(tag_requests)
      .set({ status: "rejected" })
      .where(eq(tag_requests.id, params.id))
      .returning();

    if (!request) {
      return NextResponse.json({ success: false, error: "Request not found" }, { status: 404 });
    }

    // 2. Check if the tag was already created for this request
    const [existingTag] = await db.select()
      .from(tags)
      .where(eq(tags.name, request.tag_name));

    if (existingTag) {
      // 3. Remove relations first (if you have a pivot table content_tags)
      await db.delete(content_tags).where(eq(content_tags.tag_id, existingTag.id));

      // 4. Remove the tag itself
      await db.delete(tags).where(eq(tags.id, existingTag.id));
    }

    return NextResponse.json({
      success: true,
      message: "Tag request rejected and rolled back",
      request,
    });
  } catch (err: any) {
    console.error("Reject tag error:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
