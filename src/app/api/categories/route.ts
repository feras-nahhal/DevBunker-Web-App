import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { categories } from "@/lib/tables";
import { eq } from "drizzle-orm";

export async function GET(req: NextRequest) {
  try {
    const result = await db.select().from(categories).where(eq(categories.status, "approved"));
    return NextResponse.json({ success: true, categories: result });
  } catch (err: any) {
    console.error("Fetch categories error:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
