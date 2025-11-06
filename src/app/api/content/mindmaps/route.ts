import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { content, users, categories, tags, content_tags } from "@/lib/tables";
import { eq, like, sql, gte, lte } from "drizzle-orm";  // Added gte, lte for date comparisons
import { authMiddleware } from "@/lib/authMiddleware";

// GET /api/content/mindmaps?q=&status=&category=&tag=&author_email=&created_after=&created_before=&updated_after=&updated_before=
export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const search = url.searchParams.get("q") || "";
    const categoryId = url.searchParams.get("category") || "";
    const statusParam = url.searchParams.get("status"); // don't default yet
    const tagParam = url.searchParams.get("tag") || "";  // New: Filter by tag name
    const authorEmailParam = url.searchParams.get("author_email") || "";  // New: Filter by author email
    const createdAfterParam = url.searchParams.get("created_after") || "";  // New: Created on/after date (ISO string)
    const createdBeforeParam = url.searchParams.get("created_before") || "";  // New: Created before date
    const updatedAfterParam = url.searchParams.get("updated_after") || "";  // New: Updated on/after date
    const updatedBeforeParam = url.searchParams.get("updated_before") || "";  // New: Updated before date

    const conditions = [eq(content.content_type, "mindmap")];

    // ✅ Handle multiple statuses (unchanged)
    if (statusParam) {
      const statusList = statusParam.split(",").map((s) => s.trim());
      if (statusList.length > 1) {
        conditions.push(sql`${content.status} IN (${sql.join(statusList, sql`, `)})`);
      } else {
        conditions.push(eq(content.status, statusList[0]));
      }
    } else {
      // default only if not specified
      conditions.push(eq(content.status, "published"));
    }

    // ✅ Existing filters (unchanged)
    if (categoryId) conditions.push(eq(content.category_id, categoryId));
    if (search) conditions.push(like(content.title, `%${search}%`));

    // 🆕 New filter: Tag (using EXISTS subquery to check for association)
    if (tagParam) {
      conditions.push(
        sql`EXISTS (
          SELECT 1 FROM ${content_tags} ct
          JOIN ${tags} t ON ct.tag_id = t.id
          WHERE ct.content_id = ${content.id} AND t.name = ${tagParam}
        )`
      );
    }

    // 🆕 New filter: Author email
    if (authorEmailParam) {
      conditions.push(eq(users.email, authorEmailParam));
    }

    // 🆕 New filters: Date ranges (parse ISO strings to Date objects)
    if (createdAfterParam) {
      const createdAfter = new Date(createdAfterParam);
      if (isNaN(createdAfter.getTime())) {
        return NextResponse.json(
          { success: false, error: "Invalid created_after date format. Use ISO string (e.g., 2023-01-01T00:00:00Z)." },
          { status: 400 }
        );
      }
      conditions.push(gte(content.created_at, createdAfter));
    }
    if (createdBeforeParam) {
      const createdBefore = new Date(createdBeforeParam);
      if (isNaN(createdBefore.getTime())) {
        return NextResponse.json(
          { success: false, error: "Invalid created_before date format. Use ISO string (e.g., 2023-01-01T00:00:00Z)." },
          { status: 400 }
        );
      }
      conditions.push(lte(content.created_at, createdBefore));
    }
    if (updatedAfterParam) {
      const updatedAfter = new Date(updatedAfterParam);
      if (isNaN(updatedAfter.getTime())) {
        return NextResponse.json(
          { success: false, error: "Invalid updated_after date format. Use ISO string (e.g., 2023-01-01T00:00:00Z)." },
          { status: 400 }
        );
      }
      conditions.push(gte(content.updated_at, updatedAfter));
    }
    if (updatedBeforeParam) {
      const updatedBefore = new Date(updatedBeforeParam);
      if (isNaN(updatedBefore.getTime())) {
        return NextResponse.json(
          { success: false, error: "Invalid updated_before date format. Use ISO string (e.g., 2023-01-01T00:00:00Z)." },
          { status: 400 }
        );
      }
      conditions.push(lte(content.updated_at, updatedBefore));
    }

    // Combine safely (unchanged)
    const whereClause = conditions.reduce(
      (acc, condition, idx) =>
        idx === 0 ? condition : sql`${acc} AND ${condition}`,
      conditions[0]
    );

    const mindmaps = await db
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
        authorEmail: users.email,
        categoryName: categories.name,
      })
      .from(content)
      .leftJoin(users, eq(content.author_id, users.id))
      .leftJoin(categories, eq(content.category_id, categories.id))
      .where(whereClause);

    // -------------------------------
    // 🟢 Fetch tags for all content items (unchanged)
    // -------------------------------
    const contentIds = mindmaps.map((m) => m.id);

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

    // -------------------------------
    // 🟢 Filter out nulls to match TagData type (unchanged)
    // -------------------------------
    const tagsData: TagData[] = rawTagsData
      .filter((t) => t.content_id && t.tagName) // remove any nulls
      .map((t) => ({
        content_id: t.content_id!, // non-null assertion is safe now
        tagName: t.tagName!,
      }));

    // -------------------------------
    // 🟢 Group tags by content_id (unchanged)
    // -------------------------------
    const tagsMap: Record<string, string[]> = {};
    tagsData.forEach((t) => {
      if (!tagsMap[t.content_id]) tagsMap[t.content_id] = [];
      tagsMap[t.content_id].push(t.tagName);
    });

    // -------------------------------
    // 🟢 Attach tags to content (unchanged)
    // -------------------------------
    const mindmapsWithTags = mindmaps.map((m) => ({
      ...m,
      tags: tagsMap[m.id] || [], // attach tags array
    }));

    return NextResponse.json({ success: true, mindmaps: mindmapsWithTags });
  } catch (err: unknown) {
    const errorMessage =
      err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}


// POST /api/content/mindmaps
export async function POST(req: NextRequest) {
  const authResponse = await authMiddleware(req, { roles: ["creator", "admin"] });
  if (authResponse instanceof Response) return authResponse;

  const user = authResponse;
  const body = await req.json();

  try {
    // 1️⃣ Insert the mindmap content (UPDATED: Default status to "draft" if not provided)
    const [newMindmap] = await db.insert(content)
      .values({
        ...body,
        content_type: "mindmap",
        author_id: user.id,
        excalidraw_data: body.excalidraw_data || null,
        status: body.status || "draft", // NEW: Use body.status or default to "draft"
      })
      .returning();

    // 2️⃣ Save tags (many-to-many) - FIXED: Use body.tag_ids instead of body.tags
    if (body.tag_ids && Array.isArray(body.tag_ids)) {
      const tagMappings = body.tag_ids.map((tagId: string) => ({
        content_id: newMindmap.id,
        tag_id: tagId,
      }));
      if (tagMappings.length > 0) {
        await db.insert(content_tags).values(tagMappings);
      }
    }

    // Optional: Fetch the mindmap with tags for response (if your frontend needs it)
    const mindmapWithTags = await db
      .select()
      .from(content)
      .leftJoin(content_tags, eq(content.id, content_tags.content_id))
      .leftJoin(tags, eq(content_tags.tag_id, tags.id))
      .where(eq(content.id, newMindmap.id));

    console.log(`Mindmap saved with status: ${newMindmap.status}`); // NEW: Log for debugging

    return NextResponse.json({ success: true, mindmap: newMindmap, tags: mindmapWithTags });
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : "Unknown error";
    console.error("API Error:", errorMessage);
    return NextResponse.json({ success: false, error: errorMessage }, { status: 500 });
  }
}
