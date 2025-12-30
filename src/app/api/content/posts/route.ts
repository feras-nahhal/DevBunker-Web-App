import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { content, users, categories, tags, content_tags } from "@/lib/tables";
import { eq, like, sql, gte, lte } from "drizzle-orm";  // Added gte, lte for date comparisons
import { authMiddleware } from "@/lib/authMiddleware";
// ✅ Import your enum for validation (unchanged)
import { CONTENT_STATUS } from "@/lib/enums";

// GET /api/content/posts?q=&status=&category=&tag=&author_email=&created_after=&created_before=&updated_after=&updated_before=
export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const search = url.searchParams.get("q") || "";
    const categoryId = url.searchParams.get("category") || "";
    const statusParam = url.searchParams.get("status"); // ✅ don't default yet
    const tagParam = url.searchParams.get("tag") || "";  // New: Filter by tag name
    const authorEmailParam = url.searchParams.get("author_email") || "";  // New: Filter by author email
    const createdAfterParam = url.searchParams.get("created_after") || "";  // New: Created on/after date (ISO string)
    const createdBeforeParam = url.searchParams.get("created_before") || "";  // New: Created before date
    const updatedAfterParam = url.searchParams.get("updated_after") || "";  // New: Updated on/after date
    const updatedBeforeParam = url.searchParams.get("updated_before") || "";  // New: Updated before date
    const visibilityParam = url.searchParams.get("visibility"); // 🆕

    const conditions = [eq(content.content_type, "post")];

    // ✅ Handle multiple statuses
    if (statusParam) {
      const statusList = statusParam.split(",").map((s) => s.trim());
      if (statusList.length > 1) {
        conditions.push(
          sql`${content.status} IN (${sql.join(statusList, sql`, `)})`
        );
      } else {
        conditions.push(eq(content.status, statusList[0]));
      }
    } else {
      // Default → published only
      conditions.push(eq(content.status, CONTENT_STATUS.PUBLISHED));
    }

    // 🆕 Visibility filter (ONLY for published content)
    if (visibilityParam) {
      if (visibilityParam !== "public" && visibilityParam !== "private") {
        return NextResponse.json(
          { success: false, error: `Invalid visibility: ${visibilityParam}` },
          { status: 400 }
        );
      }

      // Visibility only makes sense for published posts
      conditions.push(eq(content.visibility, visibilityParam));
    } else {

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

    // ✅ Combine conditions safely (unchanged)
    const whereClause = conditions.reduce(
      (acc, condition, idx) =>
        idx === 0 ? condition : sql`${acc} AND ${condition}`,
      conditions[0]
    );

    const posts = await db
      .select({
        id: content.id,
        title: content.title,
        description: content.description,
        content_body: content.content_body,
        content_type: content.content_type,
        status: content.status,
        visibility: content.visibility, // 🆕
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
    // 🟢 Fetch tags for all post items (unchanged)
    // -------------------------------
    const contentIds = posts.map((p) => p.id);

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
    const postsWithTags = posts.map((p) => ({
      ...p,
      tags: tagsMap[p.id] || [],
    }));

    return NextResponse.json({ success: true, posts: postsWithTags });
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : "Unknown error";
    console.error("Fetch posts error:", errorMessage);
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}



// POST /api/content/posts
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
      const allowedStatuses = [CONTENT_STATUS.DRAFT, CONTENT_STATUS.PUBLISHED];
      if (!allowedStatuses.includes(body.status)) {
        return NextResponse.json(
          { success: false, error: `Invalid status: ${body.status}` },
          { status: 400 }
        );
      }
      status = body.status;
    }

    // ✅ Validate and normalize visibility
    let visibility = "public"; // default
    if (body.visibility) {
      const allowedVisibilities = ["private", "public"];
      if (!allowedVisibilities.includes(body.visibility)) {
        return NextResponse.json(
          { success: false, error: `Invalid visibility: ${body.visibility}` },
          { status: 400 }
        );
      }
      visibility = body.visibility;
    }

    // ✅ Prepare insert data for content
    const insertData = {
      title: body.title,
      description: body.description || body.title.substring(0, 150) + "...",
      content_body: body.body || body.content_body,
      content_type: "post",
      status,
      visibility, // NEW
      author_id: user.id,
      category_id: body.category_id || null,
      excalidraw_data: body.excalidraw_data || null,
    };

    // ✅ Insert post
    const [newPost] = await db.insert(content).values(insertData).returning();
    const contentId = newPost.id;

    // ✅ Handle tags if provided (array of IDs)
    if (Array.isArray(body.tag_ids) && body.tag_ids.length > 0) {
      const tagRows = body.tag_ids.map((tagId: string) => ({
        content_id: contentId,
        tag_id: tagId,
      }));

      await db.insert(content_tags).values(tagRows).onConflictDoNothing(); // avoid duplicates
    }

    return NextResponse.json({ success: true, post: newPost });
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : "Unknown error";
    console.error("Create post error:", errorMessage);

    if (errorMessage.includes("foreign key")) {
      return NextResponse.json(
        { success: false, error: "Invalid category_id, tag_id, or author_id." },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: false, error: errorMessage }, { status: 500 });
  }
}
