import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { content,users, categories, tags, content_tags } from "@/lib/tables";
import { eq, like, sql } from "drizzle-orm";
import { authMiddleware } from "@/lib/authMiddleware";
// ✅ Import your enum for validation
import { CONTENT_STATUS } from "@/lib/enums"; 

// GET /api/content/posts?q=&status=&category=
export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const search = url.searchParams.get("q") || "";
    const categoryId = url.searchParams.get("category") || "";
    const statusParam = url.searchParams.get("status"); // ✅ don't default yet

    const conditions = [eq(content.content_type, "post")];

    // ✅ Handle multiple statuses
    if (statusParam) {
      const statusList = statusParam.split(",").map((s) => s.trim());
      if (statusList.length > 1) {
        conditions.push(sql`${content.status} IN (${sql.join(statusList, sql`, `)})`);
      } else {
        conditions.push(eq(content.status, statusList[0]));
      }
    } else {
      // Default if not specified
      conditions.push(eq(content.status, "published"));
    }

    if (categoryId) conditions.push(eq(content.category_id, categoryId));
    if (search) conditions.push(like(content.title, `%${search}%`));

    // ✅ Combine conditions safely
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
    // 🟢 Fetch tags for all post items
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

    // ✅ Prepare insert data for content
    const insertData = {
      title: body.title,
      description: body.description || body.title.substring(0, 150) + "...",
      content_body: body.body || body.content_body,
      content_type: "post",
      status,
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
