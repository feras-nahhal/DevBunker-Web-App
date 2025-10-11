import { NextResponse,NextRequest } from "next/server";
import { db } from "@/lib/db";
import { tags } from "@/lib/tables";
import { like, eq, sql } from "drizzle-orm";
// GET /api/tags/search?q=tagname
export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const q = url.searchParams.get("q") || "";

  const whereClause = sql`${like(tags.name, `%${q}%`)} AND ${eq(tags.status, "approved")}`;

  const result = await db.select().from(tags).where(whereClause);

  return NextResponse.json({ success: true, tags: result });
}
