import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { categories, category_requests } from "@/lib/tables";
import { authMiddleware } from "@/lib/authMiddleware";

// POST /api/admin/categories → create new category (admin only)
export async function POST(request: NextRequest): Promise<NextResponse> {
  const authResult = await authMiddleware(request, { roles: ["admin"] });
  if (authResult instanceof Response) return authResult;

  const user: { id: string } = authResult;
  const body = await request.json();

  if (!body.name) {
    return NextResponse.json({ success: false, error: "Name is required" }, { status: 400 });
  }

  try {
    const [createdCategory] = await db
      .insert(categories)
      .values({
        name: body.name,
        description: body.description || null,
        status: "approved", // since only admin can create
        created_by: user.id,
      })
      .returning();

    // 2️⃣ Insert a "request" record
    await db.insert(category_requests).values({
      user_id: user.id,
      category_name: body.name,
      description: body.description || null,
      status: "approved", // admin-created → immediately approved
    });

    return NextResponse.json({ success: true, category: createdCategory });
  } catch (err: unknown) {
    console.error("Create category error:", err);
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 }
    );
  }
}
