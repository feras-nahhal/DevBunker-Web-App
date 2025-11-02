// src/app/api/auth/verify-pin/route.ts
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { password_reset_pins } from "@/lib/tables";
import { eq, gte, and } from "drizzle-orm";

export async function POST(req: NextRequest) {
  try {
    const { email, pin } = await req.json();

    if (!email || !pin) {
      return NextResponse.json(
        { success: false, error: "Email and PIN are required" },
        { status: 400 }
      );
    }

    const now = new Date();

    // Check PIN (exists and not expired)
    const [record] = await db
      .select()
      .from(password_reset_pins)
      .where(
        and(
          eq(password_reset_pins.email, email),
          eq(password_reset_pins.pin, Number(pin)),
          gte(password_reset_pins.expires_at, now) // correct Drizzle syntax
        )
      );

    if (!record) {
      return NextResponse.json(
        { success: false, error: "Invalid or expired PIN" },
        { status: 400 }
      );
    }

    // Delete the PIN after successful verification
    await db
      .delete(password_reset_pins)
      .where(eq(password_reset_pins.id, record.id));

    return NextResponse.json({ success: true, message: "PIN verified" });
  } catch (error) {
    console.error("Error verifying PIN:", error);
    return NextResponse.json(
      { success: false, error: "Failed to verify PIN" },
      { status: 500 }
    );
  }
}
