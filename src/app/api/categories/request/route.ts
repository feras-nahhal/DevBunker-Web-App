// src/app/api/category-requests/route.ts
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { category_requests, notifications, users } from "@/lib/tables";
import { authMiddleware, AuthPayload } from "@/lib/authMiddleware";
import { eq } from "drizzle-orm";
import { NOTIFICATION_TYPES, USER_ROLES } from "@/lib/enums";
export async function POST(req: NextRequest) {
  const authResult = await authMiddleware(req); // any authenticated user
  if (authResult instanceof Response) return authResult;

  const user = authResult as AuthPayload;
  const body = await req.json();

  if (!body.category_name) {
    return NextResponse.json(
      { success: false, error: "category_name is required" },
      { status: 400 }
    );
  }

  const [request] = await db.insert(category_requests)
    .values({
      category_name: body.category_name,
      description: body.description || null,
      user_id: user.id,
      status: "pending",
    })
    .returning();

 // Get all admin users
  const adminUsers = await db.select().from(users).where(eq(users.role, USER_ROLES.ADMIN));

  // Create notifications for all admins
  if (adminUsers.length > 0) {
    const notificationsData = adminUsers.map((admin) => ({
      user_id: admin.id,
      title: "New Category Request Submitted",
      message: `${user.email} requested a new category: "${body.category_name}"`,
      type: "Category_Request",
    }));

    await db.insert(notifications).values(notificationsData);
  }

  // ✅ Notify the author (confirmation)
  await db.insert(notifications).values({
    user_id: user.id,
    title: "Category Request Received ",
    message: `Your category request "${body.category_name}" has been submitted for review.`,
    type: NOTIFICATION_TYPES.SYSTEM,
  });

  return NextResponse.json({ success: true, request });
}
