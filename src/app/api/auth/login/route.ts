import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { users } from "@/lib/tables";
import { eq } from "drizzle-orm";
import { signToken } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();

    // Find user by email
    const [user] = await db.select().from(users).where(eq(users.email, email));

    if (!user) {
      return NextResponse.json({ success: false, error: "User not found" });
    }

    // Compare password
    const isValid = await bcrypt.compare(password, user.password_hash);
    if (!isValid) {
      return NextResponse.json({ success: false, error: "Invalid password" });
    }

    // Sign JWT
    const token = signToken({ id: user.id, email: user.email, role: user.role });

    return NextResponse.json({ success: true, token, user: { id: user.id, email: user.email, role: user.role } });
  } catch (err: any) {
    console.error(err);
    return NextResponse.json({ success: false, error: err?.message ?? "Unknown error" });
  }
}
