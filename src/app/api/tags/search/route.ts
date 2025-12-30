import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { tags } from "@/lib/tables";
import { like, eq, and } from "drizzle-orm";

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const q = url.searchParams.get("q") || "";
  const page = parseInt(url.searchParams.get("page") || "1");
  const limit = parseInt(url.searchParams.get("limit") || "20");

  const offset = (page - 1) * limit;

  // Fetch all matching tags
  const allTags = await db.select().from(tags).where(
    and(
      like(tags.name, `%${q}%`),
      eq(tags.status, "approved")
    )
  );

  // Paginate in memory (for small datasets)
  const paginated = allTags.slice(offset, offset + limit);

  const hasMore = offset + limit < allTags.length;

  return NextResponse.json({
    success: true,
    items: paginated,  // 🔹 match frontend expectation
    hasMore           // 🔹 boolean
  });
}
