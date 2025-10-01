import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { content } from "@/lib/tables";
import { eq } from "drizzle-orm";
import { authMiddleware } from "@/lib/authMiddleware";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const mindmapId = params.id;
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

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const authResponse = await authMiddleware(req, { roles: ["creator", "admin"] });
  if (authResponse instanceof Response) return authResponse;

  const mindmapId = params.id;
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

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const authResponse = await authMiddleware(req, { roles: ["creator", "admin"] });
  if (authResponse instanceof Response) return authResponse;

  const mindmapId = params.id;

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
