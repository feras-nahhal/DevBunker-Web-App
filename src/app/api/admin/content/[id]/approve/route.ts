import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { content, notifications } from "@/lib/tables";
import { eq } from "drizzle-orm";
import { authMiddleware } from "@/lib/authMiddleware";

// PUT /api/admin/content/[id]/approve
export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> } // 👈 params is now a Promise
): Promise<NextResponse> {
  const authResult = await authMiddleware(request, { roles: ["admin"] });
  if (authResult instanceof Response) return authResult;

  // 👇 await the params promise
  const { id: contentId } = await context.params;

  try {
    const [approved] = await db
      .update(content)
      .set({ status: "published" })
      .where(eq(content.id, contentId))
      .returning();

    if (!approved) {
      return NextResponse.json(
        { success: false, error: "Content not found" },
        { status: 404 }
      );
    }

    // 2️⃣ Create a notification for the author
    await db.insert(notifications).values({
      user_id: approved.author_id,
      title: "Your Research has been approved",
      message: `Your Research "${approved.title}" has been approved and published by the admin.`,
      type: "Research_APPROVAL",
    });

    return NextResponse.json({
      success: true,
      content: approved,
      message: "Content approved",
    });
  } catch (err: unknown) {
    console.error("Approve content error:", err);
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 }
    );
  }
}
