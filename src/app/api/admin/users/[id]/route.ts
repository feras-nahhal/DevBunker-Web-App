// src/app/api/admin/users/[id]/route.ts
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users } from "@/lib/tables";
import { eq } from "drizzle-orm";
import { authMiddleware } from "@/lib/authMiddleware";

// DELETE /api/admin/users/[id]
export async function DELETE(req: Request, context: { params: { id: string } }) {
  const authResult = await authMiddleware(req, { roles: ["admin"] });
  if (authResult instanceof Response) return authResult;

  const userId = context.params.id;

  try {
    const deleted = await db.delete(users).where(eq(users.id, userId)).returning();
    if (!deleted.length) {
      return NextResponse.json({ success: false, error: "User not found" }, { status: 404 });
    }
    return NextResponse.json({ success: true, message: "User deleted" });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
