import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  users,
  categories,
  tags,
  content,
  bookmarks,
  read_later,
  notifications,
  tag_requests,
  category_requests,
  comments,
  references_link,
} from "@/lib/tables";
import { eq } from "drizzle-orm";
import { authMiddleware } from "@/lib/authMiddleware";

// DELETE /api/admin/users/[id]
export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ id: string }> } // ✅ params is a Promise
) {
  try {
    // Authenticate admin
    const authResult = await authMiddleware(req, { roles: ["admin"] });
    if (authResult instanceof Response) return authResult;

    // ✅ Await the params
    const { id: userId } = await context.params;

    // ✅ Transaction to safely handle related deletions
    const deletedUser = await db.transaction(async (tx) => {
      // 1️⃣ Nullify ownership references (make sure schema allows nullable)
      await tx
        .update(categories)
        .set({ created_by: null })
        .where(eq(categories.created_by, userId));

      await tx
        .update(tags)
        .set({ created_by: null })
        .where(eq(tags.created_by, userId));

      await tx
        .update(content)
        .set({ author_id: null })
        .where(eq(content.author_id, userId));

      // 2️⃣ Delete user-related tables
      await tx.delete(bookmarks).where(eq(bookmarks.user_id, userId));
      await tx.delete(read_later).where(eq(read_later.user_id, userId));
      await tx.delete(notifications).where(eq(notifications.user_id, userId));
      await tx.delete(tag_requests).where(eq(tag_requests.user_id, userId));
      await tx.delete(category_requests).where(eq(category_requests.user_id, userId));
      await tx.delete(comments).where(eq(comments.user_id, userId));
      await tx.delete(references_link).where(eq(references_link.user_id, userId));

      // 3️⃣ Finally delete the user
      const deleted = await tx.delete(users).where(eq(users.id, userId)).returning();

      return deleted;
    });

    // ✅ Handle if user not found
    if (!deletedUser || deletedUser.length === 0) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 }
      );
    }

    // ✅ Success response
    return NextResponse.json({ success: true, message: "User deleted successfully" });
  } catch (err: unknown) {
    console.error("❌ Delete user error:", err);
    const errorMessage = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}
