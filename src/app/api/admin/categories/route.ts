import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { categories } from "@/lib/tables";
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
    const [createdCategory] = await db.insert(categories).values({
      name: body.name,
      description: body.description || null,
      status: "approved", // since only admin can create
      created_by: user.id,
    }).returning();

    return NextResponse.json({ success: true, category: createdCategory });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
