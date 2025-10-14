import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { tag_requests, users } from "@/lib/tables"; // FIXED: Import users table for join (adapt if in @/lib/schema)
import { authMiddleware } from "@/lib/authMiddleware";
import { eq } from "drizzle-orm";

// GET /api/admin/tags/requests → list all tag requests (all statuses) with user email
export async function GET(req: NextRequest): Promise<NextResponse> {
  const authResult = await authMiddleware(req, { roles: ["admin"] });
  if (authResult instanceof Response) return authResult;

  try {
    // FIXED: Select specific fields + left join with users for email (all statuses, no filter)
    const result = await db
      .select({
        id: tag_requests.id,
        tag_name: tag_requests.tag_name,
        user_id: tag_requests.user_id,
        status: tag_requests.status,
        created_at: tag_requests.created_at,
        authorEmail: users.email, // FIXED: Join to get email (null if user missing)
      })
      .from(tag_requests)
      .leftJoin(users, eq(tag_requests.user_id, users.id)) // FIXED: Left join on user_id (adapt if created_by)
      // No where clause – fetches ALL statuses (Pending, Approved, Rejected, etc.)
      // Optional: Add .where(eq(tag_requests.status, "pending")) if you want pending only later

    return NextResponse.json({ success: true, requests: result });
  } catch (err: unknown) {
    console.error("Fetch tag requests error:", err);
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 }
    );
  }
}
