import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { content } from "@/lib/tables";
import { eq } from "drizzle-orm";
import { authMiddleware } from "@/lib/authMiddleware";

// PUT /api/admin/content/[id]/reject
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  const authResult = await authMiddleware(request, { roles: ["admin"] });
  if (authResult instanceof Response) return authResult;

  const contentId = params.id;

  try {
    const [rejected] = await db
      .update(content)
      .set({ status: "rejected" })
      .where(eq(content.id, contentId))
      .returning();

    if (!rejected) {
      return NextResponse.json(
        { success: false, error: "Content not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      content: rejected,
      message: "Content rejected",
    });
  } catch (err: unknown) {
    console.error("Reject content error:", err);
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 }
    );
  }
}
