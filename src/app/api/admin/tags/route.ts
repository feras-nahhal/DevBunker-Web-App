import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { tags } from "@/lib/tables";
import { authMiddleware } from "@/lib/authMiddleware";

export async function POST(req: Request) {
  const authResult = await authMiddleware(req, { roles: ["admin"] });
  if (authResult instanceof Response) return authResult;

  const user = authResult;
  const body = await req.json();

  if (!body.name) {
    return NextResponse.json({ success: false, error: "Name is required" }, { status: 400 });
  }

  try {
    const [createdTag] = await db.insert(tags).values({
      name: body.name,
      status: "approved", // since only admin can create
      created_by: user.id,
    }).returning();

    return NextResponse.json({ success: true, tag: createdTag });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
