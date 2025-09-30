import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { read_later } from "@/lib/tables";
import { authMiddleware } from "@/lib/authMiddleware";
import { eq } from "drizzle-orm";

// GET /api/read-later
export async function GET(req: Request) {
  const authResult = await authMiddleware(req, { roles: ["consumer", "admin", "creator"] });
  if (authResult instanceof Response) return authResult;

  const user = authResult;
  const items = await db.query.read_later.findMany({
    where: eq(read_later.user_id, user.id),
  });

  return NextResponse.json({ success: true, items });
}

// POST /api/read-later
export async function POST(req: Request) {
  const authResult = await authMiddleware(req, { roles: ["consumer", "admin", "creator"] });
  if (authResult instanceof Response) return authResult;

  const user = authResult;
  const body = await req.json();

  const [item] = await db.insert(read_later)
    .values({ user_id: user.id, content_id: body.content_id })
    .onConflictDoNothing()
    .returning();

  return NextResponse.json({ success: true, item });
}
