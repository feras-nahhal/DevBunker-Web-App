import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { categories, category_requests, content } from "@/lib/tables";
import { authMiddleware } from "@/lib/authMiddleware";
import { eq } from "drizzle-orm";

// PUT /api/admin/categories/[id]/approve
export async function PUT(
  request: NextRequest,
  context: { params: { id: string } }
): Promise<NextResponse> {
  const authResult = await authMiddleware(request, { roles: ["admin"] });
  if (authResult instanceof Response) return authResult;

  try {
    const { id } = context.params;

    // 1. Mark request as approve
    const [requestRow] = await db
      .update(category_requests)
      .set({ status: "approve" })
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
      // Check if content is using this category
      const usedContent = await db
        .select()
        .from(content)
        .where(eq(content.category_id, existingCategory.id));

      if (usedContent.length === 0) {
        await db.delete(categories).where(eq(categories.id, existingCategory.id));
      }
    }

    return NextResponse.json({
      success: true,
      message: "Category request approve and rolled back if unused",
    });
  } catch (err: unknown) {
    console.error("Reject category error:", err);
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 }
    );
  }
}
