import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users } from "@/lib/tables";

export async function GET() {
  try {
    const usersData = await db.select().from(users).limit(5);

    // Ensure always JSON serializable
    return NextResponse.json({
      success: true,
      data: usersData ?? [],
    });
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : "Unknown error";
    console.error("DB error:", err);
    return NextResponse.json({
      success: false,
      error: errorMessage,
    });
  }
}
