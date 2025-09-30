import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "./auth";

export interface AuthMiddlewareOptions {
  roles?: string[]; // allowed roles for the route
}

export async function authMiddleware(
  req: NextRequest,
  options?: AuthMiddlewareOptions
) {
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

    // Attach user info to request (optional, for downstream handlers)
    (req as any).user = payload;

    return NextResponse.next();
  } catch (err: any) {
    return NextResponse.json({ success: false, error: "Invalid or expired token" }, { status: 401 });
  }
}
