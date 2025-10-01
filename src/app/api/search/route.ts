// src/app/api/search/route.ts
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { content, categories, tags, content_tags } from "@/lib/tables";
import { and, eq, ilike, inArray } from "drizzle-orm";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const q = searchParams.get("q") || "";
    const type = searchParams.get("type");
    const category = searchParams.get("category");
    const tagsFilter = searchParams.getAll("tags"); // supports multiple tags ?tags=AI&tags=ML

    let conditions = [];

    if (q) conditions.push(ilike(content.title, `%${q}%`));
    if (type) conditions.push(eq(content.content_type, type));
    if (category) conditions.push(eq(content.category_id, category));

    // Build base query
    let query = db
      .select({
        id: content.id,
        title: content.title,
        description: content.description,
        type: content.content_type,
        category_id: content.category_id,
      })
      .from(content)
      .where(conditions.length ? and(...conditions) : undefined);

    let results = await query;

    // Filter by tags if provided
    if (tagsFilter.length > 0) {
      results = await db
        .select({
          id: content.id,
          title: content.title,
          description: content.description,
          type: content.content_type,
          category_id: content.category_id,
        })
        .from(content)
        .innerJoin(content_tags, eq(content_tags.content_id, content.id))
        .innerJoin(tags, eq(content_tags.tag_id, tags.id))
        .where(inArray(tags.name, tagsFilter));
    }

    return NextResponse.json({ success: true, results });
  } catch (err: any) {
    console.error("Search error:", err);
    return NextResponse.json({ success: false, error: "Search failed" }, { status: 500 });
  }
}
