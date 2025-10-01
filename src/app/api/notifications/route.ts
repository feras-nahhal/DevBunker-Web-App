import { NextResponse,NextRequest } from "next/server";
import { db } from "@/lib/db";
import { notifications } from "@/lib/tables";
import { authMiddleware } from "@/lib/authMiddleware";
import { eq } from "drizzle-orm";

export async function GET(req: NextRequest) {
  const user = await authMiddleware(req);
  if (user instanceof Response) return user;

  const list = await db
    .select()
    .from(notifications)
    .where(eq(notifications.user_id, user.id));

  return NextResponse.json({ success: true, notifications: list });
}
