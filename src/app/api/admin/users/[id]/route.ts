// src/app/api/admin/users/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users } from "@/lib/tables";
import { eq } from "drizzle-orm";
import { authMiddleware } from "@/lib/authMiddleware";

// DELETE /api/admin/users/[id]
export async function DELETE(
  req: NextRequest,
  context: { params: { id: string } }
) {
  try {
    // Authenticate admin
    const authResult = await authMiddleware(req, { roles: ["admin"] });
    if (authResult instanceof Response) return authResult;

    const userId = context.params.id;

    // Delete user
    const deleted = await db.delete(users).where(eq(users.id, userId)).returning();

    if (!deleted || deleted.length === 0) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, message: "User deleted" });
  } catch (err: unknown) {
    console.error("Delete user error:", err);
    const errorMessage =
      err instanceof Error ? err.message : "An unknown error occurred";
    return NextResponse.json({ success: false, error: errorMessage }, { status: 500 });
  }
}
