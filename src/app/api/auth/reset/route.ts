import { NextResponse } from "next/server";
import { Resend } from "resend";

export async function POST(req: Request) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    const resend = new Resend(process.env.RESEND_API_KEY);

    // ✅ Use your actual deployed domain or localhost for dev
    const baseUrl =
      process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
    const resetLink = `${baseUrl}/auth/reset?email=${encodeURIComponent(email)}`;

    const result = await resend.emails.send({
      from: "onboarding@resend.dev",
      to: email,
      subject: "Password Reset Request",
      html: `
        <p>Hello,</p>
        <p>Click the link below to reset your password:</p>
        <a href="${resetLink}" style="color: #1a73e8;">Reset Password</a>
        <p>If you didn't request this, you can ignore this email.</p>
      `,
    });

    return NextResponse.json({ success: true, result });
  } catch (error: any) {
    console.error("Error in reset API:", error);
    return NextResponse.json(
      { error: error.message || "Failed to send email" },
      { status: 500 }
    );
  }
}
