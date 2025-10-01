// src/app/api/bookmarks/route.ts
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { bookmarks } from "@/lib/tables";
import { authMiddleware, AuthPayload } from "@/lib/authMiddleware";
import { eq } from "drizzle-orm";

// GET /api/bookmarks → list user's bookmarks
export async function GET(req: NextRequest) {
  const authResult = await authMiddleware(req, { roles: ["consumer", "admin", "creator"] });
  if (authResult instanceof Response) return authResult;

  const user = authResult as AuthPayload;
  const userBookmarks = await db.query.bookmarks.findMany({
    where: eq(bookmarks.user_id, user.id),
  });

  return NextResponse.json({ success: true, bookmarks: userBookmarks });
}

// POST /api/bookmarks → add bookmark
export async function POST(req: NextRequest) {
  const authResult = await authMiddleware(req, { roles: ["consumer", "admin", "creator"] });
  if (authResult instanceof Response) return authResult;

  const user = authResult as AuthPayload;
  const body = await req.json();

  const [bookmark] = await db.insert(bookmarks)
    .values({ user_id: user.id, content_id: body.content_id })
    .onConflictDoNothing()
    .returning();

  return NextResponse.json({ success: true, bookmark });
}
