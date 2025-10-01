import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { content } from "@/lib/tables";
import { eq } from "drizzle-orm";
import { authMiddleware } from "@/lib/authMiddleware";

type RouteParams = { params: Promise<{ id: string }> };

// GET /api/content/[id]
export async function GET(req: NextRequest, context: RouteParams) {
  const { id: mindmapId } = await context.params;

  try {
    const [mindmap] = await db.select().from(content).where(eq(content.id, mindmapId));

    if (!mindmap) {
      return NextResponse.json({ success: false, error: "Mindmap not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, mindmap });
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ success: false, error: errorMessage }, { status: 500 });
  }
}

// PUT /api/content/[id]
export async function PUT(req: NextRequest, context: RouteParams) {
  const { id: mindmapId } = await context.params;

  const authResponse = await authMiddleware(req, { roles: ["creator", "admin"] });
  if (authResponse instanceof Response) return authResponse;

  const body = await req.json();

  try {
    const [updated] = await db.update(content).set(body).where(eq(content.id, mindmapId)).returning();

    if (!updated) {
      return NextResponse.json({ success: false, error: "Mindmap not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, mindmap: updated });
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ success: false, error: errorMessage }, { status: 500 });
  }
}

// DELETE /api/content/[id]
export async function DELETE(req: NextRequest, context: RouteParams) {
  const { id: mindmapId } = await context.params;

  const authResponse = await authMiddleware(req, { roles: ["creator", "admin"] });
  if (authResponse instanceof Response) return authResponse;

  try {
    const deleted = await db.delete(content).where(eq(content.id, mindmapId)).returning();

    if (!deleted.length) {
      return NextResponse.json({ success: false, error: "Mindmap not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: "Mindmap deleted" });
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ success: false, error: errorMessage }, { status: 500 });
  }
}
