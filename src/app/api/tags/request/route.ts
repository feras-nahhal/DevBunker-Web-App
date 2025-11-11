import { NextResponse,NextRequest } from "next/server";
import { db } from "@/lib/db";
import { notifications, tag_requests, users } from "@/lib/tables";
import { authMiddleware } from "@/lib/authMiddleware";
import { eq } from "drizzle-orm";
import { NOTIFICATION_TYPES, USER_ROLES } from "@/lib/enums";
// POST /api/tags/request { tag_name, description }
export async function POST(req: NextRequest) {
  const authResult = await authMiddleware(req); // any authenticated user
  if (authResult instanceof Response) return authResult;

  const user = authResult;
  const body = await req.json();

  if (!body.tag_name) {
    return NextResponse.json({ success: false, error: "tag_name is required" }, { status: 400 });
  }

  const [request] = await db.insert(tag_requests)
    .values({
      tag_name: body.tag_name,
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
      title: "New Tag Request Submitted",
      message: `${user.email} requested a new tag: "${body.tag_name}"`,
      type: "Tag_Request",
    }));

    await db.insert(notifications).values(notificationsData);
  }

  // ✅ Notify the author (confirmation)
  await db.insert(notifications).values({
    user_id: user.id,
    title: "Tag Request Received ",
    message: `Your tag request "${body.tag_name}" has been submitted for review.`,
    type: NOTIFICATION_TYPES.SYSTEM,
  });
  return NextResponse.json({ success: true, request });
}
