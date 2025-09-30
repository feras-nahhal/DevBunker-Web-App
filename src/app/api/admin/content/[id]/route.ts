import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { content } from "@/lib/tables";
import { eq } from "drizzle-orm";
import { authMiddleware } from "@/lib/authMiddleware";

export async function DELETE(req: Request, context: { params: { id: string } }) {
  const authResult = await authMiddleware(req, { roles: ["admin"] });
  if (authResult instanceof Response) return authResult;

  const contentId = context.params.id;

  try {
    const deleted = await db.delete(content).where(eq(content.id, contentId));
    if (!deleted)
      return NextResponse.json({ success: false, error: "Content not found" }, { status: 404 });

    return NextResponse.json({ success: true, message: "Content deleted" });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message });
  }
}
// DELETE /admin/content/[id]/route.ts