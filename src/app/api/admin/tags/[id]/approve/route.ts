import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { tags, tag_requests, notifications } from "@/lib/tables";
import { authMiddleware } from "@/lib/authMiddleware";
import { eq } from "drizzle-orm";

// helper type
type RouteParams = { params: Promise<{ id: string }> };

// PUT /api/admin/tags/[id]/approve
export async function PUT(req: NextRequest, context: RouteParams): Promise<NextResponse> {
  const authResult = await authMiddleware(req, { roles: ["admin"] });
  if (authResult instanceof Response) return authResult;

  // ✅ Await the params promise to get the id
  const { id } = await context.params;

  try {
    // 1. Approve the request
    const [request] = await db
      .update(tag_requests)
      .set({ status: "approved" })
      .where(eq(tag_requests.id, id))
      .returning();

    if (!request) {
      return NextResponse.json({ success: false, error: "Request not found" }, { status: 404 });
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
    const [tag] = await db.insert(tags).values({
      name: request.tag_name,
      created_by: request.user_id,
      status: "approved",
    }).returning();

    // 4️. Send a notification to the requester
    await db.insert(notifications).values({
      user_id: request.user_id,
      title: "Your tag request has been approved",
      message: `Your tag request for "${request.tag_name}" has been approved and added to the platform.`,
      type: "TAG_APPROVAL",
    });

    return NextResponse.json({ success: true, message: "Tag approved and created", tag });
  } catch (err: unknown) {
    console.error("Approve tag error:", err);
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 }
    );
  }
}
