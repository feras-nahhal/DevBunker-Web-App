import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { content } from "@/lib/tables";
import { eq } from "drizzle-orm";
import { authMiddleware } from "@/lib/authMiddleware";

// DELETE /api/admin/content/[id]
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  const authResult = await authMiddleware(request, { roles: ["admin"] });
  if (authResult instanceof Response) return authResult;

  const contentId = params.id;

  try {
    const result = await db.delete(content).where(eq(content.id, contentId));

    if (result.rowCount === 0) {
      return NextResponse.json(
        { success: false, error: "Content not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Content deleted",
    });
  } catch (err: unknown) {
    console.error("Delete content error:", err);
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 }
    );
  }
}
