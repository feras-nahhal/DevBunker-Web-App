import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { tag_requests } from "@/lib/tables";
import { authMiddleware } from "@/lib/authMiddleware";
import { eq } from "drizzle-orm";

// GET /api/admin/tags/requests → list all pending requests
export async function GET(req: NextRequest): Promise<NextResponse> {
  const authResult = await authMiddleware(req, { roles: ["admin"] });
  if (authResult instanceof Response) return authResult;

  try {
    const result = await db
      .select()
      .from(tag_requests)
      .where(eq(tag_requests.status, "pending"));

    return NextResponse.json({ success: true, requests: result });
  } catch (err: unknown) {
    console.error("Fetch tag requests error:", err);
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 }
    );
  }
}
