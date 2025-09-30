import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { content } from "@/lib/tables";
import { eq } from "drizzle-orm";
import { authMiddleware } from "@/lib/authMiddleware";

export async function PUT(req: Request, context: { params: { id: string } }) {
  const authResult = await authMiddleware(req, { roles: ["admin"] });
  if (authResult instanceof Response) return authResult;

  const contentId = context.params.id;

  try {
    const [rejected] = await db.update(content)
      .set({ status: "rejected" })
      .where(eq(content.id, contentId))
      .returning();

    if (!rejected)
      return NextResponse.json({ success: false, error: "Content not found" }, { status: 404 });

    return NextResponse.json({ success: true, content: rejected, message: "Content rejected" });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message });
  }
}
// PUT /admin/content/[id]/reject/route.ts