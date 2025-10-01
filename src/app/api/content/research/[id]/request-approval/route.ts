import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { content } from "@/lib/tables";
import { eq } from "drizzle-orm";
import { authMiddleware } from "@/lib/authMiddleware";

type RouteParams = { params: Promise<{ id: string }> };

// POST /api/content/research/[id]/request-approval
export async function POST(req: NextRequest, context: RouteParams) {
  const { id: researchId } = await context.params;

  const authResult = await authMiddleware(req, { roles: ["creator", "admin"] });
  if (authResult instanceof Response) return authResult;

  try {
    const [updated] = await db.update(content)
      .set({ status: "pending_approval" })
      .where(eq(content.id, researchId))
      .returning();

    if (!updated) {
      return NextResponse.json(
        { success: false, error: "Research not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      research: updated,
      message: "Approval requested",
    });
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ success: false, error: errorMessage }, { status: 500 });
  }
}
