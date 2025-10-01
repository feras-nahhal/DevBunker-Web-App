import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { category_requests } from "@/lib/tables";
import { authMiddleware } from "@/lib/authMiddleware";

export async function POST(req: Request) {
  const authResult = await authMiddleware(req); // any authenticated user
  if (authResult instanceof Response) return authResult;

  const user = authResult;
  const body = await req.json();

  if (!body.category_name) {
    return NextResponse.json({ success: false, error: "category_name is required" }, { status: 400 });
  }

  const [request] = await db.insert(category_requests)
    .values({
      category_name: body.category_name,
      description: body.description || null,
      user_id: user.id,
      status: "pending",
    })
    .returning();

  return NextResponse.json({ success: true, request });
}
