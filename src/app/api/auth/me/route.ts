// src/app/api/auth/me/route.ts
import { NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";

export async function GET(req: Request) {
  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.split(" ")[1];
    const payload = verifyToken(token);

    return NextResponse.json({ success: true, user: payload });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: "Invalid or expired token" }, { status: 401 });
  }
}
