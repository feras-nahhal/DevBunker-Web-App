import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { categories, category_requests, content } from "@/lib/tables";
import { authMiddleware } from "@/lib/authMiddleware";
import { eq } from "drizzle-orm";

// PUT /admin/categories/[id]/approve
export async function PUT(req: Request, { params }: { params: { id: string } }) {
  const authResult = await authMiddleware(req, { roles: ["admin"] });
  if (authResult instanceof Response) return authResult;

  try {
    // 1. Approve request
    const [request] = await db.update(category_requests)
      .set({ status: "approved" })
      .where(eq(category_requests.id, params.id))
      .returning();

    if (!request) {
      return NextResponse.json({ success: false, error: "Request not found" }, { status: 404 });
    }

    // 2. Insert into categories (ignore duplicates)
    const [category] = await db.insert(categories)
      .values({
        name: request.category_name,
        description: request.description,
        created_by: request.user_id,
        status: "approved",
      })
      .onConflictDoNothing({ target: categories.name }) // prevents duplicate
      .returning();

    return NextResponse.json({
      success: true,
      message: category ? "Category approved" : "Category already exists",
      category,
    });
  } catch (err: any) {
    console.error("Approve category error:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
