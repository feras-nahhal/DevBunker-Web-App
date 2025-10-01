import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "./auth";

export interface AuthMiddlewareOptions {
  roles?: string[]; // allowed roles for the route
}

// Define payload type returned by verifyToken
export interface AuthPayload {
  id: string;
  email: string;
  role: string;
  status: string;
}

export async function authMiddleware(
  req: NextRequest,
  options?: AuthMiddlewareOptions
): Promise<NextResponse | void> {
  try {
    const authHeader = req.headers.get("Authorization");

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const token = authHeader.split(" ")[1];
    const payload = verifyToken(token) as AuthPayload;

    if (options?.roles && !options.roles.includes(payload.role)) {
      return NextResponse.json(
        { success: false, error: "Forbidden" },
        { status: 403 }
      );
    }

    // Attach user info to request safely
    (req as unknown as { user?: AuthPayload }).user = payload;

    return NextResponse.next();
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : "Invalid or expired token";
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 401 }
    );
  }
}
