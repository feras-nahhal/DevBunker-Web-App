import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { tags } from "@/lib/tables";
import { eq } from "drizzle-orm";

// GET /api/tags → list approved tags
export async function GET() {
  try {
    const result = await db.select().from(tags).where(eq(tags.status, "approved"));
    return NextResponse.json({ success: true, tags: result });
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ success: false, error: errorMessage });
  }
}
