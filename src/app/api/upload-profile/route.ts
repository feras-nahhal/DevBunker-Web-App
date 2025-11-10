import { authMiddleware } from "@/lib/authMiddleware";
import { v2 as cloudinary, UploadApiResponse, UploadApiErrorResponse } from "cloudinary";
import { db } from "@/lib/db";
import { users } from "@/lib/tables";
import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

// ✅ Cloudinary config
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME!,
  api_key: process.env.CLOUDINARY_API_KEY!,
  api_secret: process.env.CLOUDINARY_API_SECRET!,
});

export async function POST(req: NextRequest) {
  const user = await authMiddleware(req);
  if (user instanceof Response) return user;

  const formData = await req.formData();
  const file = formData.get("image") as File;

  if (!file) {
    return NextResponse.json({ success: false, error: "No file uploaded" });
  }

  const bytes = Buffer.from(await file.arrayBuffer());

  // ✅ Typed upload_stream with proper result type
  const uploaded: UploadApiResponse = await new Promise((resolve, reject) => {
    const upload = cloudinary.uploader.upload_stream(
      { folder: "profile_pics" },
      (error?: UploadApiErrorResponse, result?: UploadApiResponse) => {
        if (error) return reject(error);
        if (!result) return reject(new Error("Upload failed with no result"));
        resolve(result);
      }
    );

    upload.end(bytes);
  });

  // ✅ Save URL to DB
  await db
    .update(users)
    .set({ profile_image: uploaded.secure_url })
    .where(eq(users.id, user.id));

  return NextResponse.json({
    success: true,
    url: uploaded.secure_url,
  });
}

export async function GET(req: NextRequest) {
  const user = await authMiddleware(req);
  if (user instanceof Response) return user;

  try {
    const userData = await db.query.users.findFirst({
      where: eq(users.id, user.id),
      columns: { profile_image: true },
    });

    return NextResponse.json({
      success: true,
      url: userData?.profile_image || null,
    });
  } catch (err) {
    console.error("GET /profile-image error:", err);
    return NextResponse.json(
      { success: false, error: "Failed to fetch profile image" },
      { status: 500 }
    );
  }
}
