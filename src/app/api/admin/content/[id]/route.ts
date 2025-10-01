import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { content } from "@/lib/tables";
import { eq } from "drizzle-orm";
import { authMiddleware } from "@/lib/authMiddleware";

// DELETE /api/admin/content/[id]
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> } // 👈 params is now a Promise
): Promise<NextResponse> {
  const authResult = await authMiddleware(request, { roles: ["admin"] });
  if (authResult instanceof Response) return authResult;

  // 👇 await the params promise
  const { id: contentId } = await context.params;


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
