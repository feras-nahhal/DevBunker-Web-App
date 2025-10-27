// src/app/api/auth/change-password-reset/route.ts
import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { users } from "@/lib/tables";
import { eq } from "drizzle-orm";

export async function POST(req: NextRequest) {
  try {
    const { email, newPassword } = await req.json();

    // Validate input
    if (!email || !newPassword) {
      return NextResponse.json(
        { success: false, error: "Email and new password are required" },
        { status: 400 }
      );
    }

    if (newPassword.length < 6) {
      return NextResponse.json(
        { success: false, error: "Password must be at least 6 characters long" },
        { status: 400 }
      );
    }

    // Check if user exists
    const [user] = await db.select().from(users).where(eq(users.email, email));

    if (!user) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 }
      );
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update in DB
    await db
      .update(users)
      .set({ password_hash: hashedPassword })
      .where(eq(users.email, email));

    console.log(`✅ Password reset successfully for ${email}`);
    return NextResponse.json({ success: true, message: "Password reset successfully" });
  } catch (error) {
    console.error("Reset password error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to reset password" },
      { status: 500 }
    );
  }
}
