// src/lib/authMiddleware.ts
import { NextResponse } from "next/server";
import { verifyToken } from "./auth";

export interface AuthMiddlewareOptions {
  roles?: string[];
}

export async function authMiddleware(req: Request, options?: AuthMiddlewareOptions) {
  try {
    const authHeader = req.headers.get("Authorization");

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.split(" ")[1];
    const payload: any = verifyToken(token);

    if (options?.roles && !options.roles.includes(payload.role)) {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }

    // Instead of NextResponse.next(), just return the payload
    return payload;
  } catch (err: any) {
    return NextResponse.json({ success: false, error: "Invalid or expired token" }, { status: 401 });
  }
}
