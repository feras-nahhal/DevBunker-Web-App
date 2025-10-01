import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { notifications } from "@/lib/tables";
import { authMiddleware } from "@/lib/authMiddleware";
import { eq } from "drizzle-orm";

export async function PUT(req: Request) {
  const user = await authMiddleware(req);
  if (user instanceof Response) return user;

  await db
    .update(notifications)
    .set({ read: true })
    .where(eq(notifications.user_id, user.id));

  return NextResponse.json({ success: true, message: "All notifications marked as read" });
}
