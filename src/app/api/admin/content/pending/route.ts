import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { content } from "@/lib/tables";
import { eq } from "drizzle-orm";
import { authMiddleware } from "@/lib/authMiddleware";

export async function GET(req: Request) {
  // Only admin can access
  const authResult = await authMiddleware(req, { roles: ["admin"] });
  if (authResult instanceof Response) return authResult;

  try {
    const pendingContent = await db.select().from(content).where(eq(content.status, "pending_approval"));
    return NextResponse.json({ success: true, content: pendingContent });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message });
  }
}
