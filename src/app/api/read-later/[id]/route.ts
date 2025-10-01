import { NextResponse,NextRequest } from "next/server";
import { db } from "@/lib/db";
import { read_later } from "@/lib/tables";
import { authMiddleware } from "@/lib/authMiddleware";
import { and, eq } from "drizzle-orm";

// DELETE /api/read-later/[id]
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const authResult = await authMiddleware(req, { roles: ["consumer", "admin", "creator"] });
  if (authResult instanceof Response) return authResult;

  const user = authResult;
  const [deleted] = await db.delete(read_later)
    .where(and(eq(read_later.id, params.id), eq(read_later.user_id, user.id)))
    .returning();

  if (!deleted) {
    return NextResponse.json({ success: false, error: "Read-later item not found" }, { status: 404 });
  }

  return NextResponse.json({ success: true, message: "Removed from read later" });
}
