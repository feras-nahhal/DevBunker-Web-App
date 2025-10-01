import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { categories, category_requests } from "@/lib/tables";
import { authMiddleware } from "@/lib/authMiddleware";
import { eq } from "drizzle-orm";

// PUT /api/admin/categories/[id]/approve
export async function PUT(
  req: NextRequest,
  context: { params: Promise<{ id: string }> } // 👈 params is now a Promise
): Promise<NextResponse> {
  const authResult = await authMiddleware(req, { roles: ["admin"] });
  if (authResult instanceof Response) return authResult;

  // 👇 await the promise
  const { id } = await context.params;

  try {
    const [requestRow] = await db
      .update(category_requests)
      .set({ status: "approved" })
      .where(eq(category_requests.id, id))
      .returning();

    if (!requestRow) {
      return NextResponse.json({ success: false, error: "Request not found" }, { status: 404 });
    }

    const [category] = await db
      .insert(categories)
      .values({
        name: requestRow.category_name,
        description: requestRow.description,
        created_by: requestRow.user_id,
        status: "approved",
      })
      .onConflictDoNothing({ target: categories.name })
      .returning();

    return NextResponse.json({
      success: true,
      message: category ? "Category approved" : "Category already exists",
      category,
    });
  } catch (err: unknown) {
    console.error("Approve category error:", err);
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 }
    );
  }
}
