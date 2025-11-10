import { db } from "@/lib/db";
import { users } from "@/lib/tables";
import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params; // 👈 await the params object
  const userId = id?.trim();

  if (!userId) {
    return NextResponse.json({ success: false, error: "User ID is required" }, { status: 400 });
  }

  try {
    const userData = await db.query.users.findFirst({
      where: eq(users.id, userId),
      columns: { profile_image: true },
    });

    if (!userData) {
      console.log("User not found with ID:", userId);
      return NextResponse.json({ success: false, error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      url: userData.profile_image || "/default-profile.png",
    });
  } catch (err) {
    console.error("GET /profile-image/[id] error:", err);
    return NextResponse.json({ success: false, error: "Failed to fetch profile image" }, { status: 500 });
  }
}
