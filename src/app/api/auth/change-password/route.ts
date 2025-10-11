// src/app/api/auth/change-password/route.ts
import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { users } from "@/lib/tables";
import { eq } from "drizzle-orm";
import { verifyToken } from "@/lib/auth"; // Assuming this exists from your /me route
import { User } from "@/types/user"; // Optional: Import if needed for typing (from your useAuth hook)

// Define the expected token payload structure (matches your signToken in /login)
interface TokenPayload {
  id: string; // UUID string
  email: string;
  role: string;
}

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get("Authorization");

    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.split(" ")[1];
    const payload = verifyToken(token) as TokenPayload; // Fixed: Explicit type assertion to resolve TS error on payload.id

    const { oldPassword, newPassword } = await req.json();

    if (!oldPassword || !newPassword) {
      return NextResponse.json({ success: false, error: "Old and new passwords are required" }, { status: 400 });
    }

    if (newPassword.length < 6) {
      return NextResponse.json({ success: false, error: "New password must be at least 6 characters" }, { status: 400 });
    }

    // Find user by ID from token (Fixed: payload.id is now typed as string/UUID)
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, payload.id)); // No more TS error here

    if (!user) {
      return NextResponse.json({ success: false, error: "User not found" }, { status: 404 });
    }

    if (!user.password_hash) {
      return NextResponse.json({ success: false, error: "User password not found" }, { status: 500 });
    }

    // Verify old password
    const isValidOldPassword = await bcrypt.compare(oldPassword, user.password_hash);
    if (!isValidOldPassword) {
      return NextResponse.json({ success: false, error: "Invalid old password" }, { status: 401 });
    }

    // Hash new password
    const hashedNewPassword = await bcrypt.hash(newPassword, 10);

    // Update password in DB
    await db
      .update(users)
      .set({ password_hash: hashedNewPassword })
      .where(eq(users.id, payload.id)); // Reuse payload.id for consistency

    return NextResponse.json({ success: true, message: "Password updated successfully" });
  } catch (err: unknown) {
    console.error("Change password error:", err);
    const errorMessage = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ success: false, error: "Failed to change password" }, { status: 500 });
  }
}
