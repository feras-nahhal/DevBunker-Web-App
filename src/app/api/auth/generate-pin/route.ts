import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { password_reset_pins } from "@/lib/tables";
import { randomInt } from "crypto";
import { eq } from "drizzle-orm";
import { Resend } from "resend"; // ✅ correct import

const resend = new Resend(process.env.RESEND_API_KEY!);

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json({ success: false, error: "Email is required" }, { status: 400 });
    }

    const pin = randomInt(1000, 10000);
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

    // Delete old PINs
    await db.delete(password_reset_pins).where(eq(password_reset_pins.email, email));

    // Insert new PIN
    await db.insert(password_reset_pins).values({
      email,
      pin,
      expires_at: expiresAt,
    });

    // Send email
    await resend.emails.send({
      from: "devbunker@resend.dev",
      to: email,
      subject: "Your Password Reset PIN",
      html: `
        <p>Hello,</p>
        <p>Your 4-digit PIN for password reset is:</p>
        <h2>${pin}</h2>
        <p>This PIN will expire in 15 minutes.</p>
      `,
    });

    console.log(`✅ Generated and sent PIN for ${email}: ${pin}`);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error generating PIN:", error);
    return NextResponse.json({ success: false, error: "Failed to generate PIN" }, { status: 500 });
  }
}
