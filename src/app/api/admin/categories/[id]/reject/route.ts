import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { categories, category_requests, content } from "@/lib/tables";
import { authMiddleware } from "@/lib/authMiddleware";
import { eq } from "drizzle-orm";

// PUT /admin/categories/[id]/reject
export async function PUT(req: Request, { params }: { params: { id: string } }) {
  const authResult = await authMiddleware(req, { roles: ["admin"] });
  if (authResult instanceof Response) return authResult;

  try {
    // 1. Mark request as rejected
    const [request] = await db.update(category_requests)
      .set({ status: "rejected" })
      .where(eq(category_requests.id, params.id))
      .returning();

    if (!request) {
      return NextResponse.json({ success: false, error: "Request not found" }, { status: 404 });
    }

    // 2. Rollback category if it exists
    const [existingCategory] = await db.select().from(categories).where(eq(categories.name, request.category_name));

    if (existingCategory) {
      // Check if content is using this category
      const usedContent = await db.select().from(content).where(eq(content.category_id, existingCategory.id));

      if (usedContent.length === 0) {
        await db.delete(categories).where(eq(categories.id, existingCategory.id));
      }
    }

    return NextResponse.json({ success: true, message: "Category request rejected and rolled back if unused" });
  } catch (err: any) {
    console.error("Reject category error:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
