// src/lib/authMiddleware.ts
import { NextResponse, NextRequest } from "next/server";
import { verifyToken } from "./auth";

export interface AuthMiddlewareOptions {
  roles?: string[]; // allowed roles for the route
}

// Define what the payload of your JWT should look like
export interface AuthPayload {
  id: string;
  email: string;
  role: string;
  status: string;
}

export async function authMiddleware(
  req: NextRequest,
  options?: AuthMiddlewareOptions
): Promise<AuthPayload | NextResponse> {
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

    // Check roles if provided
    if (options?.roles && !options.roles.includes(payload.role)) {
      return NextResponse.json(
        { success: false, error: "Forbidden" },
        { status: 403 }
      );
    }

    // Optional: attach user info to the request for downstream usage
    // using a type assertion instead of 'any'
    (req as unknown as { user?: AuthPayload }).user = payload;

    return payload;
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : "Invalid or expired token";
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 401 }
    );
  }
}
