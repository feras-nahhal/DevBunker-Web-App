// devbunker\src\app\api\content\mindmaps\[id]\route.ts
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { content } from "@/lib/tables";
import { eq } from "drizzle-orm";
import { authMiddleware } from "@/lib/authMiddleware";

export async function GET(req: Request, context: { params: { id: string } }) {
  try {
    const mindmapId = context.params.id; // <-- use context.params
    const [mindmap] = await db.select().from(content).where(eq(content.id, mindmapId));

    if (!mindmap)
      return NextResponse.json({ success: false, error: "Mindmap not found" }, { status: 404 });

    return NextResponse.json({ success: true, mindmap });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message });
  }
}

export async function PUT(req: Request, context: { params: { id: string } }) {
  const authResponse = await authMiddleware(req, { roles: ["creator", "admin"] });
  if (authResponse instanceof Response) return authResponse;

  const mindmapId = context.params.id;
  const body = await req.json();

  try {
    const [updated] = await db.update(content)
      .set(body)
      .where(eq(content.id, mindmapId))
      .returning();

    if (!updated)
      return NextResponse.json({ success: false, error: "Mindmap not found" }, { status: 404 });

    return NextResponse.json({ success: true, mindmap: updated });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message });
  }
}

export async function DELETE(req: Request, context: { params: { id: string } }) {
  const authResponse = await authMiddleware(req, { roles: ["creator", "admin"] });
  if (authResponse instanceof Response) return authResponse;

  const mindmapId = context.params.id;

  try {
    const deleted = await db.delete(content).where(eq(content.id, mindmapId));
    if (!deleted)
      return NextResponse.json({ success: false, error: "Mindmap not found" }, { status: 404 });

    return NextResponse.json({ success: true, message: "Mindmap deleted" });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message });
  }
}
