import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { categories, category_requests, content, notifications } from "@/lib/tables";
import { authMiddleware } from "@/lib/authMiddleware";
import { eq } from "drizzle-orm";

// PUT /api/admin/categories/[id]/reject
export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> } // 👈 note: params is now a Promise
): Promise<NextResponse> {
  const authResult = await authMiddleware(request, { roles: ["admin"] });
  if (authResult instanceof Response) return authResult;

  // 👇 await the params promise
  const { id } = await context.params;

  try {
    // 1. Mark request as rejected
    const [requestRow] = await db
      .update(category_requests)
      .set({ status: "rejected" })
      .where(eq(category_requests.id, id))
      .returning();

    if (!requestRow) {
      return NextResponse.json(
        { success: false, error: "Request not found" },
        { status: 404 }
      );
    }

    // 2. Rollback category if it exists
    const [existingCategory] = await db
      .select()
      .from(categories)
      .where(eq(categories.name, requestRow.category_name));

    if (existingCategory) {
      const usedContent = await db
        .select()
        .from(content)
        .where(eq(content.category_id, existingCategory.id));

      if (usedContent.length === 0) {
        await db.delete(categories).where(eq(categories.id, existingCategory.id));
      }
    }

    // 3️⃣ Send notification to requester
    await db.insert(notifications).values({
      user_id: requestRow.user_id,
      title: "Category Request Rejected",
      message: `Your category request for "${requestRow.category_name}" has been rejected by the admin.`,
      type: "CATEGORY_REJECTION",
    });

    return NextResponse.json({
      success: true,
      message: "Category request rejected and rolled back if unused",
    });
  } catch (err: unknown) {
    console.error("Reject category error:", err);
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 }
    );
  }
}
