// src/app/api/content/posts/route.ts
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { content } from "@/lib/tables";
import { eq, like, sql } from "drizzle-orm";
import { authMiddleware } from "@/lib/authMiddleware";

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const search = url.searchParams.get("q") || "";
    const categoryId = url.searchParams.get("category") || "";
    const status = url.searchParams.get("status") || "published";

    const conditions = [eq(content.content_type, "post")];

    if (status) conditions.push(eq(content.status, status));
    if (categoryId) conditions.push(eq(content.category_id, categoryId));
    if (search) conditions.push(like(content.title, `%${search}%`));

    // Merge conditions using `sql` and `AND`
    const whereClause = conditions.reduce(
      (acc, condition, idx) => (idx === 0 ? condition : sql`${acc} AND ${condition}`),
      conditions[0]
    );

    const posts = await db.select().from(content).where(whereClause);

    return NextResponse.json({ success: true, posts });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message });
  }
}

export async function POST(req: Request) {
  const authResult = await authMiddleware(req, { roles: ["creator", "admin"] });

  // If the middleware returns a NextResponse, it means an error
  if (authResult instanceof Response) return authResult;

  // authResult now contains the decoded user payload
  const user = authResult;

  const body = await req.json();

  const [newPost] = await db.insert(content).values({
    ...body,
    content_type: "post",
    author_id: user.id,
  }).returning();

  return NextResponse.json({ success: true, post: newPost });
}
