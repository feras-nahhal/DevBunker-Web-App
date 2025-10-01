import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { content } from "@/lib/tables";
import { eq } from "drizzle-orm";
import { authMiddleware } from "@/lib/authMiddleware";

// GET /api/admin/content/pending
export async function GET(request: NextRequest): Promise<NextResponse> {
  const authResult = await authMiddleware(request, { roles: ["admin"] });
  if (authResult instanceof Response) return authResult;

  try {
    const pendingContent = await db
      .select()
      .from(content)
      .where(eq(content.status, "pending_approval"));

    return NextResponse.json({ success: true, content: pendingContent });
  } catch (err: unknown) {
    console.error("Pending content error:", err);
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 }
    );
  }
}
