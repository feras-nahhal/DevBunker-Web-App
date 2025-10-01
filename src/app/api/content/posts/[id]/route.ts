import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { content } from "@/lib/tables";
import { eq } from "drizzle-orm";
import { authMiddleware } from "@/lib/authMiddleware";

type RouteParams = { params: Promise<{ id: string }> };

// GET /api/content/[id]
export async function GET(req: NextRequest, context: RouteParams) {
  const { id: postId } = await context.params;

  try {
    const [post] = await db.select().from(content).where(eq(content.id, postId));

    if (!post)
      return NextResponse.json({ success: false, error: "Post not found" }, { status: 404 });

    return NextResponse.json({ success: true, post });
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ success: false, error: errorMessage }, { status: 500 });
  }
}

// PUT /api/content/[id]
export async function PUT(req: NextRequest, context: RouteParams) {
  const { id: postId } = await context.params;

  const authResult = await authMiddleware(req, { roles: ["creator", "admin"] });
  if (authResult instanceof Response) return authResult;

  const body = await req.json();

  try {
    const [updated] = await db.update(content).set(body).where(eq(content.id, postId)).returning();

    if (!updated)
      return NextResponse.json({ success: false, error: "Post not found" }, { status: 404 });

    return NextResponse.json({ success: true, post: updated });
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ success: false, error: errorMessage }, { status: 500 });
  }
}

// DELETE /api/content/[id]
export async function DELETE(req: NextRequest, context: RouteParams) {
  const { id: postId } = await context.params;

  const authResult = await authMiddleware(req, { roles: ["creator", "admin"] });
  if (authResult instanceof Response) return authResult;

  try {
    const deleted = await db.delete(content).where(eq(content.id, postId)).returning();

    if (!deleted.length)
      return NextResponse.json({ success: false, error: "Post not found" }, { status: 404 });

    return NextResponse.json({ success: true, message: "Post deleted" });
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ success: false, error: errorMessage }, { status: 500 });
  }
}
