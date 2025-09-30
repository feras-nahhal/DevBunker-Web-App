// src/app/api/admin/users/[id]/status/route.ts
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users } from "@/lib/tables";
import { eq } from "drizzle-orm";
import { authMiddleware } from "@/lib/authMiddleware";

// PUT /api/admin/users/[id]/status
export async function PUT(req: Request, context: { params: { id: string } }) {
  const authResult = await authMiddleware(req, { roles: ["admin"] });
  if (authResult instanceof Response) return authResult;

  const userId = context.params.id;
  const { status } = await req.json();

  if (!["active", "banned", "rejected", "pending"].includes(status)) {
    return NextResponse.json({ success: false, error: "Invalid status" }, { status: 400 });
  }

  try {
    const [updated] = await db
      .update(users)
      .set({ status })
      .where(eq(users.id, userId))
      .returning();

    if (!updated) {
      return NextResponse.json({ success: false, error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, user: updated });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
