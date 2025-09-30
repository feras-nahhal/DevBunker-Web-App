import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { content } from "@/lib/tables";
import { eq } from "drizzle-orm";
import { authMiddleware } from "@/lib/authMiddleware";

// Extract ID from URL
function getIdFromUrl(req: Request) {
  return req.url.split("/").pop();
}

export async function GET(req: Request) {
  try {
    const postId = getIdFromUrl(req);
    if (!postId) return NextResponse.json({ success: false, error: "Missing post id" }, { status: 400 });

    const [post] = await db.select().from(content).where(eq(content.id, postId));
    if (!post) return NextResponse.json({ success: false, error: "Post not found" }, { status: 404 });

    return NextResponse.json({ success: true, post });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message });
  }
}

export async function PUT(req: Request) {
  const authResult = await authMiddleware(req, { roles: ["creator", "admin"] });
  if (authResult instanceof Response) return authResult;

  const user = authResult;
  const body = await req.json();
  const postId = getIdFromUrl(req);
  if (!postId) return NextResponse.json({ success: false, error: "Missing post id" }, { status: 400 });

  try {
    const [updated] = await db.update(content).set(body).where(eq(content.id, postId)).returning();
    if (!updated) return NextResponse.json({ success: false, error: "Post not found" }, { status: 404 });

    return NextResponse.json({ success: true, post: updated });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message });
  }
}

export async function DELETE(req: Request) {
  const authResult = await authMiddleware(req, { roles: ["creator", "admin"] });
  if (authResult instanceof Response) return authResult;

  const postId = getIdFromUrl(req);
  if (!postId) return NextResponse.json({ success: false, error: "Missing post id" }, { status: 400 });

  try {
    const deleted = await db.delete(content).where(eq(content.id, postId));
    if (!deleted) return NextResponse.json({ success: false, error: "Post not found" }, { status: 404 });

    return NextResponse.json({ success: true, message: "Post deleted" });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message });
  }
}
