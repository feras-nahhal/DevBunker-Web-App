import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { content,users, categories, tags, content_tags,references_link } from "@/lib/tables";
import { eq, like, sql } from "drizzle-orm";
import { authMiddleware } from "@/lib/authMiddleware";
import { CONTENT_STATUS } from "@/lib/enums";

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
     // ✅ Default: include ALL statuses from CONTENT_STATUS enum
      const allStatuses = Object.values(CONTENT_STATUS);
      conditions.push(sql`${content.status} IN (${sql.join(allStatuses, sql`, `)})`);
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
  let body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ success: false, error: "Invalid JSON body" }, { status: 400 });
  }

  try {
    // ✅ Validate and normalize status
    let status: string = CONTENT_STATUS.DRAFT;
    if (body.status) {
      const allowedStatuses = [CONTENT_STATUS.DRAFT, CONTENT_STATUS.PENDING_APPROVAL];
      if (!allowedStatuses.includes(body.status)) {
        return NextResponse.json(
          { success: false, error: `Invalid status: ${body.status}` },
          { status: 400 }
        );
      }
      status = body.status;
    }

    // ✅ Validate references (new: array of non-empty strings)
    let references: string[] = [];
    if (body.references) {
      if (!Array.isArray(body.references)) {
        return NextResponse.json(
          { success: false, error: "References must be an array of strings" },
          { status: 400 }
        );
      }
      references = body.references.filter((ref: string) => ref && typeof ref === "string" && ref.trim().length > 0);
      if (references.length !== body.references.length) {
        console.warn("Filtered invalid/empty references");
      }
    }

    // ✅ Prepare insert data for content (research-specific)
    const insertData = {
      title: body.title,
      description: body.description || body.title.substring(0, 150) + "...",
      content_body: body.body || body.content_body,
      content_type: "research", // FIXED: Research type
      status,
      author_id: user.id,
      category_id: body.category_id || null,
      excalidraw_data: body.excalidraw_data || null, // Optional; remove if not needed for research
    };

    // ✅ Insert research content
    const [newResearch] = await db.insert(content).values(insertData).returning();
    const contentId = newResearch.id;

    // ✅ Handle tags if provided (array of IDs) – same as post
    if (Array.isArray(body.tag_ids) && body.tag_ids.length > 0) {
      const tagRows = body.tag_ids.map((tagId: string) => ({
        content_id: contentId,
        tag_id: tagId,
      }));

      await db.insert(content_tags).values(tagRows).onConflictDoNothing(); // Avoid duplicates
    }

    // ✅ Handle references if provided (new: array of strings) – similar to tags
    if (references.length > 0) {
      const referenceRows = references.map((text: string) => ({
        content_id: contentId,
        text: text.trim(), // Store trimmed text
        user_id: user.id, // Link to creator
        created_at: new Date(), // Auto-timestamp if not in schema
      }));

      await db.insert(references_link).values(referenceRows).onConflictDoNothing(); // Avoid duplicates (e.g., by unique text/content_id if schema has constraint)
    }

    return NextResponse.json({ success: true, research: newResearch }); // FIXED: Return 'research' like post returns 'post'
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : "Unknown error";
    console.error("Create research error:", errorMessage);

    if (errorMessage.includes("foreign key")) {
      return NextResponse.json(
        { success: false, error: "Invalid category_id, tag_id, or author_id." },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: false, error: errorMessage }, { status: 500 });
  }
}

