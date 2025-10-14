"use client";
import { useState, useEffect } from "react";
import { AnyContent, Comment } from "@/types/content";

export function useComments(contentId: string) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchComments = async () => {
    if (!contentId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/comments?content_id=${contentId}`);
      const data = await res.json();
      if (data.success) {
        setComments(data.comments);
      } else {
        throw new Error(data.error);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  const addComment = async (text: string, parentId?: string) => {
    try {
      const res = await fetch(`/api/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content_id: contentId,
          text,
          parent_id: parentId || null,
        }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      await fetchComments();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Unknown error");
    }
  };

  useEffect(() => {
    fetchComments();
  }, [contentId]);

  return { comments, loading, error, addComment, refresh: fetchComments };
}
