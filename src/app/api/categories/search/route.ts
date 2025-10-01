import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { categories } from "@/lib/tables";
import { like, eq, and } from "drizzle-orm";

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const q = url.searchParams.get("q") || "";

  const result = await db.select().from(categories).where(
    and(
      like(categories.name, `%${q}%`),
      eq(categories.status, "approved")
    )
  );

  return NextResponse.json({ success: true, categories: result });
}
