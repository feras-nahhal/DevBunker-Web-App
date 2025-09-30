// src/app/api/admin/tags/[id]/approve/route.ts
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { tags, tag_requests } from "@/lib/tables";
import { authMiddleware } from "@/lib/authMiddleware";
import { eq } from "drizzle-orm";

// PUT /admin/tags/[id]/approve
export async function PUT(req: Request, { params }: { params: { id: string } }) {
  const authResult = await authMiddleware(req, { roles: ["admin"] });
  if (authResult instanceof Response) return authResult;

  try {
    // 1. Approve the request
    const [request] = await db.update(tag_requests)
      .set({ status: "approved" })
      .where(eq(tag_requests.id, params.id))
      .returning();

    if (!request) {
      return NextResponse.json(
        { success: false, error: "Request not found" },
        { status: 404 }
      );
    }

    // 2. Check if the tag already exists
    const existing = await db.select().from(tags).where(eq(tags.name, request.tag_name));

    if (existing.length > 0) {
      return NextResponse.json({
        success: true,
        message: "Tag request approved (tag already existed)",
        tag: existing[0],
      });
    }

    // 3. Otherwise, create a new tag
    const [tag] = await db.insert(tags)
      .values({
        name: request.tag_name,
        created_by: request.user_id,
        status: "approved",
      })
      .returning();

    return NextResponse.json({
      success: true,
      message: "Tag approved and created",
      tag,
    });
  } catch (err: any) {
    console.error("Approve tag error:", err);
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
}
