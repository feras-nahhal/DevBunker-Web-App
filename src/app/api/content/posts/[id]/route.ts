import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { content } from "@/lib/tables";
import { eq } from "drizzle-orm";
import { authMiddleware } from "@/lib/authMiddleware";

// GET /api/content/[id]
export async function GET(req: NextRequest, context: { params: { id: string } }) {
  try {
    const postId = context.params.id;
    const [post] = await db.select().from(content).where(eq(content.id, postId));

    if (!post)
      return NextResponse.json({ success: false, error: "Post not found" }, { status: 404 });

    return NextResponse.json({ success: true, post });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

// PUT /api/content/[id]
export async function PUT(req: NextRequest, context: { params: { id: string } }) {
  const authResult = await authMiddleware(req, { roles: ["creator", "admin"] });
  if (authResult instanceof Response) return authResult;

  const user = authResult;
  const postId = context.params.id;
  const body = await req.json();

  try {
    const [updated] = await db.update(content).set(body).where(eq(content.id, postId)).returning();

    if (!updated)
      return NextResponse.json({ success: false, error: "Post not found" }, { status: 404 });

    return NextResponse.json({ success: true, post: updated });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

// DELETE /api/content/[id]
export async function DELETE(req: NextRequest, context: { params: { id: string } }) {
  const authResult = await authMiddleware(req, { roles: ["creator", "admin"] });
  if (authResult instanceof Response) return authResult;

  const postId = context.params.id;

  try {
    const deleted = await db.delete(content).where(eq(content.id, postId));
    if (!deleted)
      return NextResponse.json({ success: false, error: "Post not found" }, { status: 404 });

    return NextResponse.json({ success: true, message: "Post deleted" });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
