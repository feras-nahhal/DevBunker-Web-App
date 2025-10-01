import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { notifications } from "@/lib/tables";
import { authMiddleware } from "@/lib/authMiddleware";
import { eq } from "drizzle-orm";

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  const user = await authMiddleware(req);
  if (user instanceof Response) return user;

  const [updated] = await db
    .update(notifications)
    .set({ read: true })
    .where(eq(notifications.id, params.id))
    .returning();

  if (!updated) {
    return NextResponse.json({ success: false, error: "Notification not found" }, { status: 404 });
  }

  return NextResponse.json({ success: true, notification: updated });
}
