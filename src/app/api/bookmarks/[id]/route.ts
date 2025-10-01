// src/app/api/bookmarks/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { bookmarks } from "@/lib/tables";
import { authMiddleware, AuthPayload } from "@/lib/authMiddleware";
import { and, eq } from "drizzle-orm";

// DELETE /api/bookmarks/[id]
export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ id: string }> } // ✅ params is a Promise now
) {
  const authResult = await authMiddleware(req, { roles: ["consumer", "admin", "creator"] });
  if (authResult instanceof Response) return authResult;

  const user = authResult as AuthPayload; // properly typed

  // ✅ Await the params promise
  const { id } = await context.params;

  const [deleted] = await db
    .delete(bookmarks)
    .where(and(eq(bookmarks.id, id), eq(bookmarks.user_id, user.id)))
    .returning();

  if (!deleted) {
    return NextResponse.json({ success: false, error: "Bookmark not found" }, { status: 404 });
  }

  return NextResponse.json({ success: true, message: "Bookmark removed" });
}
