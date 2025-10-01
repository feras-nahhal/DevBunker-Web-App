import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { category_requests } from "@/lib/tables";
import { authMiddleware } from "@/lib/authMiddleware";
import { eq } from "drizzle-orm";

// GET /api/admin/categories/requests → list all pending requests
export async function GET(request: NextRequest): Promise<NextResponse> {
  const authResult = await authMiddleware(request, { roles: ["admin"] });
  if (authResult instanceof Response) return authResult;

  const result = await db
    .select()
    .from(category_requests)
    .where(eq(category_requests.status, "pending"));

  return NextResponse.json({ success: true, requests: result });
}
