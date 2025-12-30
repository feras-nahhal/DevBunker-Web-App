import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { references_link } from "@/lib/tables";
import { like, sql } from "drizzle-orm";

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const q = url.searchParams.get("q") || "";
    const page = parseInt(url.searchParams.get("page") || "1");
    const limit = parseInt(url.searchParams.get("limit") || "20");
    const offset = (page - 1) * limit;

    // Fetch unique reference texts that match search
    const allReferences = await db
      .select({ text: references_link.text })
      .from(references_link)
      .where(
        sql`${references_link.text} IS NOT NULL AND ${references_link.text} != '' AND ${like(
          references_link.text,
          `%${q}%`
        )}`
      )
      .groupBy(references_link.text)
      .orderBy(references_link.text);

    // Pagination
    const paginated = allReferences.slice(offset, offset + limit);
    const hasMore = offset + limit < allReferences.length;

    const referenceTexts = paginated.map((r) => r.text).filter(Boolean);

    return NextResponse.json({
      success: true,
      items: referenceTexts,
      hasMore,
    });
  } catch (err: unknown) {
    console.error("Reference search error:", err);
    return NextResponse.json(
      {
        success: false,
        error: err instanceof Error ? err.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
