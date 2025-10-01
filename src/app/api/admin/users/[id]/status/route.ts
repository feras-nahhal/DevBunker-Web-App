import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users } from "@/lib/tables";
import { eq } from "drizzle-orm";
import { authMiddleware, AuthPayload } from "@/lib/authMiddleware";

// Allowed status values
const ALLOWED_STATUS = ["active", "banned", "pending", "rejected"] as const;
type UserStatus = (typeof ALLOWED_STATUS)[number];

// PUT /api/admin/users/[id]/status
export async function PUT(
  req: NextRequest,
  context: { params: { id: string } }
): Promise<NextResponse> {
  // ✅ Use the correct parameter `req`
  const authResult = await authMiddleware(req, { roles: ["admin"] });
  if (authResult instanceof Response) return authResult;

  const adminUser = authResult as AuthPayload;
  const userId = context.params.id;

  const body = await req.json();
  const status: string = body.status;

  if (!ALLOWED_STATUS.includes(status as UserStatus)) {
    return NextResponse.json(
      { success: false, error: "Invalid status" },
      { status: 400 }
    );
  }

  try {
    const [updated] = await db
      .update(users)
      .set({ status })
      .where(eq(users.id, userId))
      .returning();

    if (!updated) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, user: updated });
  } catch (err: any) {
    console.error("Update user status error:", err);
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
}
