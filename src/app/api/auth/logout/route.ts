// src/app/api/auth/logout/route.ts
import { NextResponse } from "next/server";

export async function POST() {
  // Stateless logout: the frontend should remove the JWT token from storage
  return NextResponse.json({ success: true, message: "Logged out successfully" });
}
