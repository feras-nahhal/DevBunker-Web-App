import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { content } from "@/lib/tables";
import { eq } from "drizzle-orm";
import { authMiddleware } from "@/lib/authMiddleware";

// GET /api/content/research/[id]
export async function GET(req: NextRequest, context: { params: { id: string } }) {
  try {
    const researchId = context.params.id;
    const [research] = await db.select().from(content).where(eq(content.id, researchId));

    if (!research) {
      return NextResponse.json({ success: false, error: "Research not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, research });
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ success: false, error: errorMessage }, { status: 500 });
  }
}

// PUT /api/content/research/[id]
export async function PUT(req: NextRequest, context: { params: { id: string } }) {
  const authResult = await authMiddleware(req, { roles: ["creator", "admin"] });
  if (authResult instanceof Response) return authResult;

  const body = await req.json();
  const researchId = context.params.id;

  try {
    const [updated] = await db.update(content)
      .set(body)
      .where(eq(content.id, researchId))
      .returning();

    if (!updated) {
      return NextResponse.json({ success: false, error: "Research not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, research: updated });
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ success: false, error: errorMessage }, { status: 500 });
  }
}

// DELETE /api/content/research/[id]
export async function DELETE(req: NextRequest, context: { params: { id: string } }) {
  const authResult = await authMiddleware(req, { roles: ["creator", "admin"] });
  if (authResult instanceof Response) return authResult;

  const researchId = context.params.id;

  try {
    const deleted = await db.delete(content).where(eq(content.id, researchId));
    if (!deleted) {
      return NextResponse.json({ success: false, error: "Research not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: "Research deleted" });
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ success: false, error: errorMessage }, { status: 500 });
  }
}
