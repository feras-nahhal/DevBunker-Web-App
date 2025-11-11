import { db } from "@/lib/db";
import { users } from "@/lib/tables";
import { inArray } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const idsParam = url.searchParams.get("ids");
  const ids = idsParam?.split(",").map((id) => id.trim()).filter(Boolean);

  if (!ids || ids.length === 0) {
    return NextResponse.json({ success: false, error: "No user IDs provided" }, { status: 400 });
  }

  try {
    const results = await db
      .select({
        id: users.id,
        profile_image: users.profile_image,
      })
      .from(users)
      .where(inArray(users.id, ids));

    const images: Record<string, string> = {};
    for (const user of results) {
      images[user.id] = user.profile_image || "/person.jpg";
    }

    return NextResponse.json({ success: true, images });
  } catch (err) {
    console.error("GET /profile-images error:", err);
    return NextResponse.json(
      { success: false, error: "Failed to fetch profile images" },
      { status: 500 }
    );
  }
}
