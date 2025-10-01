import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { content } from "@/lib/tables";
import { eq, like, sql } from "drizzle-orm";
import { authMiddleware } from "@/lib/authMiddleware";

// GET /api/content/mindmaps?q=&status=&category=
export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const search = url.searchParams.get("q") || "";
    const categoryId = url.searchParams.get("category") || "";
    const status = url.searchParams.get("status") || "published";

    const conditions = [eq(content.content_type, "mindmap")];

    if (status) conditions.push(eq(content.status, status));
    if (categoryId) conditions.push(eq(content.category_id, categoryId));
    if (search) conditions.push(like(content.title, `%${search}%`));

    // Combine conditions safely
    const whereClause = conditions.reduce(
      (acc, condition, idx) => (idx === 0 ? condition : sql`${acc} AND ${condition}`),
      conditions[0]
    );

    const mindmaps = await db.select().from(content).where(whereClause);

    return NextResponse.json({ success: true, mindmaps });
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ success: false, error: errorMessage }, { status: 500 });
  }
}

// POST /api/content/mindmaps
export async function POST(req: NextRequest) {
  const authResponse = await authMiddleware(req, { roles: ["creator", "admin"] });
  if (authResponse instanceof Response) return authResponse;

  const user = authResponse;
  const body = await req.json();

  try {
    const [newMindmap] = await db.insert(content)
      .values({
        ...body,
        content_type: "mindmap",
        author_id: user.id,
        excalidraw_data: body.excalidraw_data || null,
      })
      .returning();

    return NextResponse.json({ success: true, mindmap: newMindmap });
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ success: false, error: errorMessage }, { status: 500 });
  }
}
