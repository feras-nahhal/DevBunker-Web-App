import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { bookmarks } from "@/lib/tables";
import { authMiddleware } from "@/lib/authMiddleware";
import { and, eq } from "drizzle-orm";

// DELETE /api/bookmarks/[id]
export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  const authResult = await authMiddleware(req, { roles: ["consumer", "admin", "creator"] });
  if (authResult instanceof Response) return authResult;

  const user = authResult;
  const [deleted] = await db.delete(bookmarks)
    .where(and(eq(bookmarks.id, params.id), eq(bookmarks.user_id, user.id)))
    .returning();

  if (!deleted) {
    return NextResponse.json({ success: false, error: "Bookmark not found" }, { status: 404 });
  }

  return NextResponse.json({ success: true, message: "Bookmark removed" });
}
