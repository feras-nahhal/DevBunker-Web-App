import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { content,users, categories, tags, content_tags } from "@/lib/tables";
import { eq, like, sql } from "drizzle-orm";
import { authMiddleware } from "@/lib/authMiddleware";

// GET /api/content/research?q=&status=&category=
export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const search = url.searchParams.get("q") || "";
    const categoryId = url.searchParams.get("category") || "";
    const statusParam = url.searchParams.get("status"); // ✅ can be multiple

    const conditions = [eq(content.content_type, "research")];

    // ✅ Handle multiple statuses
    if (statusParam) {
      const statusList = statusParam.split(",").map((s) => s.trim());
      if (statusList.length > 1) {
        conditions.push(sql`${content.status} IN (${sql.join(statusList, sql`, `)})`);
      } else {
        conditions.push(eq(content.status, statusList[0]));
      }
    } else {
      // Default: only published
      conditions.push(eq(content.status, "published"));
    }

    if (categoryId) conditions.push(eq(content.category_id, categoryId));
    if (search) conditions.push(like(content.title, `%${search}%`));

    // ✅ Combine conditions into a single SQL WHERE clause
    const whereClause = conditions.reduce(
      (acc, condition, idx) =>
        idx === 0 ? condition : sql`${acc} AND ${condition}`,
      conditions[0]
    );

    const researchItems = await db
      .select({
        id: content.id,
        title: content.title,
        description: content.description,
        content_body: content.content_body,
        content_type: content.content_type,
        status: content.status,
        author_id: content.author_id,
        category_id: content.category_id,
        excalidraw_data: content.excalidraw_data,
        created_at: content.created_at,
        updated_at: content.updated_at,
        authorEmail: users.email, // 👈 include author email
        categoryName: categories.name,
      })
      .from(content)
      .leftJoin(users, eq(content.author_id, users.id))
      .leftJoin(categories, eq(content.category_id, categories.id))
      .where(whereClause);

      // -------------------------------
    // 🟢 Fetch tags for all research items
    // -------------------------------
    const contentIds = researchItems.map((r) => r.id);

    type TagData = { content_id: string; tagName: string };

    const rawTagsData = contentIds.length
      ? await db
          .select({
            content_id: content_tags.content_id,
            tagName: tags.name,
          })
          .from(content_tags)
          .leftJoin(tags, eq(content_tags.tag_id, tags.id))
          .where(sql`${content_tags.content_id} IN (${sql.join(contentIds, sql`, `)})`)
      : [];

    const tagsData: TagData[] = rawTagsData
      .filter((t) => t.content_id && t.tagName)
      .map((t) => ({
        content_id: t.content_id!,
        tagName: t.tagName!,
      }));

    // -------------------------------
    // 🟢 Group tags by content_id
    // -------------------------------
    const tagsMap: Record<string, string[]> = {};
    tagsData.forEach((t) => {
      if (!tagsMap[t.content_id]) tagsMap[t.content_id] = [];
      tagsMap[t.content_id].push(t.tagName);
    });

    // -------------------------------
    // 🟢 Attach tags to content
    // -------------------------------
    const researchWithTags = researchItems.map((r) => ({
      ...r,
      tags: tagsMap[r.id] || [],
    }));

    return NextResponse.json({ success: true, research: researchWithTags });
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : "Unknown error";
    console.error("Fetch research error:", errorMessage);
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}

// POST /api/content/research
export async function POST(req: NextRequest) {
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
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ success: false, error: errorMessage }, { status: 500 });
  }
}
