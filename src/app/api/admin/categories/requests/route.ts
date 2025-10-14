import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { category_requests, users } from "@/lib/tables"; // FIXED: Import users table for join (adapt if in @/lib/schema)
import { authMiddleware } from "@/lib/authMiddleware";
import { eq } from "drizzle-orm";

// GET /api/admin/categories/requests → list all categories requests (all statuses) with user email
export async function GET(req: NextRequest): Promise<NextResponse> {
  const authResult = await authMiddleware(req, { roles: ["admin"] });
  if (authResult instanceof Response) return authResult;

  try {
    // FIXED: Select specific fields + left join with users for email (all statuses, no filter)
    const result = await db
      .select({
        id: category_requests.id,
        category_name: category_requests.category_name,
        user_id: category_requests.user_id,
        status: category_requests.status,
        created_at: category_requests.created_at,
        authorEmail: users.email, // FIXED: Join to get email (null if user missing)
      })
      .from(category_requests)
      .leftJoin(users, eq(category_requests.user_id, users.id)) // FIXED: Left join on user_id (adapt if created_by)
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
