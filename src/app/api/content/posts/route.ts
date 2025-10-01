import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { content } from "@/lib/tables";
import { eq, like, and } from "drizzle-orm";
import { authMiddleware } from "@/lib/authMiddleware";

// GET /api/content/posts?q=&status=&category=
export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const search = url.searchParams.get("q") || "";
    const categoryId = url.searchParams.get("category") || "";
    const status = url.searchParams.get("status") || "published";

    const conditions = [eq(content.content_type, "post")];

    if (status) conditions.push(eq(content.status, status));
    if (categoryId) conditions.push(eq(content.category_id, categoryId));
    if (search) conditions.push(like(content.title, `%${search}%`));

    const posts = await db
      .select()
      .from(content)
      .where(conditions.length ? and(...conditions) : undefined);

    return NextResponse.json({ success: true, posts });
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : "Unknown error";
    console.error("Fetch posts error:", errorMessage);
    return NextResponse.json({ success: false, error: errorMessage }, { status: 500 });
  }
}

// POST /api/content/posts
export async function POST(req: NextRequest) {
  const authResult = await authMiddleware(req, { roles: ["creator", "admin"] });
  if (authResult instanceof Response) return authResult;

  const user = authResult; // decoded user payload
  const body = await req.json();

  try {
    const [newPost] = await db.insert(content).values({
      ...body,
      content_type: "post",
      author_id: user.id,
    }).returning();

    return NextResponse.json({ success: true, post: newPost });
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : "Unknown error";
    console.error("Create post error:", errorMessage);
    return NextResponse.json({ success: false, error: errorMessage }, { status: 500 });
  }
}
