import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { read_later } from "@/lib/tables";
import { authMiddleware } from "@/lib/authMiddleware";
import { and, eq } from "drizzle-orm";

type RouteParams = { params: Promise<{ id: string }> };

// DELETE /api/read-later/[id]
export async function DELETE(req: NextRequest, context: RouteParams) {
  const { id } = await context.params;

  const authResult = await authMiddleware(req, { roles: ["consumer", "admin", "creator"] });
  if (authResult instanceof Response) return authResult;

  const user = authResult;
  const [deleted] = await db.delete(read_later)
    .where(and(eq(read_later.id, id), eq(read_later.user_id, user.id)))
    .returning();

  if (!deleted) {
    return NextResponse.json({ success: false, error: "Read-later item not found" }, { status: 404 });
  }

  return NextResponse.json({ success: true, message: "Removed from read later" });
}
