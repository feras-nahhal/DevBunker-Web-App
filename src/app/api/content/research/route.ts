import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { content } from "@/lib/tables";
import { eq, like, sql } from "drizzle-orm";
import { authMiddleware } from "@/lib/authMiddleware";

// GET /api/content/research
export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const search = url.searchParams.get("q") || "";
    const categoryId = url.searchParams.get("category") || "";
    const status = url.searchParams.get("status") || "published";

    const conditions = [eq(content.content_type, "research")];
    if (status) conditions.push(eq(content.status, status));
    if (categoryId) conditions.push(eq(content.category_id, categoryId));
    if (search) conditions.push(like(content.title, `%${search}%`));

    const whereClause = conditions.reduce(
      (acc, condition, idx) => (idx === 0 ? condition : sql`${acc} AND ${condition}`),
      conditions[0]
    );

    const researchItems = await db.select().from(content).where(whereClause);

    return NextResponse.json({ success: true, research: researchItems });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message });
  }
}

// POST /api/content/research
export async function POST(req: Request) {
  const authResult = await authMiddleware(req, { roles: ["creator", "admin"] });
  if (authResult instanceof Response) return authResult;

  const user = authResult;
  const body = await req.json();

  try {
    const [newResearch] = await db.insert(content).values({
      ...body,
      content_type: "research",
      author_id: user.id,
      status: "draft",
    }).returning();

    return NextResponse.json({ success: true, research: newResearch });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message });
  }
}
