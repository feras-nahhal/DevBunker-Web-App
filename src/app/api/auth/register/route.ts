import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { users } from "@/lib/tables";
import { eq } from "drizzle-orm"; // <-- import eq

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();

    // Check if user exists
    const existingUser = await db
      .select()
      .from(users)
      .where(eq(users.email, email)); // <-- use eq(column, value)

    if (existingUser.length > 0) {
      return NextResponse.json(
        { success: false, error: "Email already registered" },
        { status: 409 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await db.insert(users).values({
      email,
      password_hash: hashedPassword,
      role: "consumer",
      status: "active",
    }).returning();

    return NextResponse.json({ success: true, user: newUser });
  } catch (err: any) {
    console.error(err);
    return NextResponse.json({ success: false, error: err.message });
  }
}
