import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { categories } from "@/lib/tables";
import { like, eq, and, desc } from "drizzle-orm";

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const q = url.searchParams.get("q") || "";
  const page = parseInt(url.searchParams.get("page") || "1");
  const limit = parseInt(url.searchParams.get("limit") || "20");

  const offset = (page - 1) * limit;

  const allCategories = await db.select().from(categories).where(
    and(
      like(categories.name, `%${q}%`),
      eq(categories.status, "approved")
    )
  );

  const paginated = allCategories.slice(offset, offset + limit);

  const hasMore = offset + limit < allCategories.length;

  return NextResponse.json({
    success: true,
    items: paginated,  // 🔹 must be "items"
    hasMore           // 🔹 boolean
  });
}

