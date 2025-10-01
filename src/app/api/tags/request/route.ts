import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { tag_requests } from "@/lib/tables";
import { authMiddleware } from "@/lib/authMiddleware";

export async function POST(req: Request) {
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

  return NextResponse.json({ success: true, request });
}
