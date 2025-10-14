// src/app/api/admin/users/route.ts
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users } from "@/lib/tables";
import { authMiddleware } from "@/lib/authMiddleware";
import { USER_ROLES, USER_STATUS } from "@/lib/enums";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";

// GET /api/admin/users → list all users
export async function GET(req: NextRequest) {
  const authResult = await authMiddleware(req, { roles: ["admin"] });
  if (authResult instanceof Response) return authResult;

  try {
    const allUsers = await db.select().from(users);
    return NextResponse.json({ success: true, users: allUsers });
  } catch (err: unknown) {
    console.error("Get users error:", err);
    const errorMessage = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ success: false, error: errorMessage }, { status: 500 });
  }
}

// POST /api/admin/users → create a new user
export async function POST(req: NextRequest) {
  const authResult = await authMiddleware(req, { roles: ["admin"] });
  if (authResult instanceof Response) return authResult;

  try {
    const { email, password, role } = await req.json();

    // Validate role
    const userRole = Object.values(USER_ROLES).includes(role) ? role : USER_ROLES.CONSUMER;

    // Check if user exists
    const [existingUser] = await db
      .select()
      .from(users)
      .where(eq(users.email, email));

    if (existingUser) {
      return NextResponse.json(
        { success: false, error: "Email already registered" },
        { status: 409 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const [newUser] = await db
      .insert(users)
      .values({
        email,
        password_hash: hashedPassword,
        role: userRole,
        status: USER_STATUS.ACTIVE,
      })
      .returning();

    return NextResponse.json({ success: true, user: newUser });
  } catch (err: unknown) {
    console.error("Create user error:", err);
    const errorMessage = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ success: false, error: errorMessage }, { status: 500 });
  }
}