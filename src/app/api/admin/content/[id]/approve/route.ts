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
    const [approved] = await db.update(content)
      .set({ status: "published" })
      .where(eq(content.id, contentId))
      .returning();

    if (!approved)
      return NextResponse.json({ success: false, error: "Content not found" }, { status: 404 });

    return NextResponse.json({ success: true, content: approved, message: "Content approved" });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message });
  }
}
// PUT /admin/content/approve/route.ts