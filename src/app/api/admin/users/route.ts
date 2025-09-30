// src/app/api/admin/users/route.ts
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users } from "@/lib/tables";
import { authMiddleware } from "@/lib/authMiddleware";

// GET /api/admin/users → list all users
export async function GET(req: Request) {
  const authResult = await authMiddleware(req, { roles: ["admin"] });
  if (authResult instanceof Response) return authResult;

  try {
    const allUsers = await db.select().from(users);
    return NextResponse.json({ success: true, users: allUsers });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

// POST /api/admin/users → create a new user
export async function POST(req: Request) {
  const authResult = await authMiddleware(req, { roles: ["admin"] });
  if (authResult instanceof Response) return authResult;

  try {
    const body = await req.json();
    const [newUser] = await db.insert(users).values(body).returning();
    return NextResponse.json({ success: true, user: newUser });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 400 });
  }
}
