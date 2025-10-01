import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { content } from "@/lib/tables";
import { eq } from "drizzle-orm";
import { authMiddleware } from "@/lib/authMiddleware";

// PUT /api/admin/content/[id]/approve
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  const authResult = await authMiddleware(request, { roles: ["admin"] });
  if (authResult instanceof Response) return authResult;

  const contentId = params.id;

  try {
    const [approved] = await db
      .update(content)
      .set({ status: "published" })
      .where(eq(content.id, contentId))
      .returning();

    if (!approved) {
      return NextResponse.json(
        { success: false, error: "Content not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      content: approved,
      message: "Content approved",
    });
  } catch (err: unknown) {
    console.error("Approve content error:", err);
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 }
    );
  }
}
