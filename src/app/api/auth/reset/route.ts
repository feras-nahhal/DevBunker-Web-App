import { NextResponse } from "next/server";
import { Resend } from "resend";

export async function POST(req: Request) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    const resend = new Resend(process.env.RESEND_API_KEY);

    // Dynamically determine base URL
    let baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";

    // Use host header to detect preview deployment URL or production
    const host = req.headers.get("host");
    if (host) {
      const protocol = process.env.NODE_ENV === "development" ? "http" : "https";
      baseUrl = `${protocol}://${host}`;
    }

    // Build reset link
    const resetLink = `${baseUrl}/auth/reset?email=${encodeURIComponent(email)}`;

    // Send email
    const result = await resend.emails.send({
  from: "devbunker@resend.dev",
  to: email,
  subject: "ESAP Password Reset Request",
  html: `
    <p>Hi there,</p>
    <p>We received a request to reset your ESAP account password.</p>
    <p>Click the button below to securely reset your password:</p>
    <a href="${resetLink}" style="
      display: inline-block;
      padding: 10px 20px;
      background-color: #1a73e8;
      color: white;
      text-decoration: none;
      border-radius: 5px;
      font-weight: bold;
    ">Reset Password</a>
    <p>If you didn't request this, no worries — you can safely ignore this email.</p>
    <p>Thank you for using ESAP!</p>
    <p>— The ESAP Team</p>
  `,
});


    return NextResponse.json({ success: true, result });
  } catch (error: unknown) {
    console.error("Error in reset API:", error);
    return NextResponse.json(
      { success: false, error: "Unknown error occurred" },
      { status: 500 }
    );
  }
}
