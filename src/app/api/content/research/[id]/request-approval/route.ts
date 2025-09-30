import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { content } from "@/lib/tables";
import { eq } from "drizzle-orm";
import { authMiddleware } from "@/lib/authMiddleware";

// POST /api/content/research/[id]/request-approval
export async function POST(req: Request, context: { params: { id: string } }) {
  const authResult = await authMiddleware(req, { roles: ["creator", "admin"] });
  if (authResult instanceof Response) return authResult;

  const researchId = context.params.id;

  try {
    const [updated] = await db.update(content)
      .set({ status: "pending_approval" })
      .where(eq(content.id, researchId))
      .returning();

    if (!updated)
      return NextResponse.json({ success: false, error: "Research not found" }, { status: 404 });

    return NextResponse.json({ success: true, research: updated, message: "Approval requested" });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message });
  }
}
