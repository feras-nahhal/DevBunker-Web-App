// src/app/api/auth/logout/route.ts
import { NextResponse } from "next/server";

export async function POST() {
  // Invalidate token on client-side (delete localStorage/cookie)
  return NextResponse.json({ success: true, message: "Logged out successfully" });
}
