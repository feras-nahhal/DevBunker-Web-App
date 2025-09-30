import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { tag_requests } from "@/lib/tables";
import { authMiddleware } from "@/lib/authMiddleware";
import { eq } from "drizzle-orm";

// GET /admin/tags/requests → list all pending requests
export async function GET(req: Request) {
  const authResult = await authMiddleware(req, { roles: ["admin"] });
  if (authResult instanceof Response) return authResult;

  const result = await db.select().from(tag_requests).where(eq(tag_requests.status, "pending"));
  return NextResponse.json({ success: true, requests: result });
}
