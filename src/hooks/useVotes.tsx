"use client";

import { useState, useCallback } from "react";
import { useAuthContext } from "./AuthProvider";

export function useVote(contentId: string) {
  const { token, isAuthenticated } = useAuthContext(); // ✅ use token + auth check
  const [likes, setLikes] = useState(0);
  const [dislikes, setDislikes] = useState(0);
  const [userVote, setUserVote] = useState<"like" | "dislike" | null>(null);
  const [loading, setLoading] = useState(false);

  // ✅ Fetch counts for one card
  const fetchCounts = useCallback(async () => {
    try {
      const res = await fetch(`/api/vote/counts?content_ids=${contentId}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const data = await res.json();

      if (data.success && data.counts[contentId]) {
        setLikes(data.counts[contentId].likes);
        setDislikes(data.counts[contentId].dislikes);
        if (data.counts[contentId].user_vote) {
          setUserVote(data.counts[contentId].user_vote);
        }
      }
    } catch (err) {
      console.error("Error fetching vote counts:", err);
    }
  }, [contentId, token]);

  // ✅ Optimistic UI vote handler
  const vote = useCallback(
    async (type: "like" | "dislike") => {
      if (loading) return;
      if (!isAuthenticated) {
        console.warn("User must be logged in to vote.");
        return;
      }

      // ⚡ Optimistic update
      setLoading(true);
      const previousVote = userVote;
      const prevLikes = likes;
      const prevDislikes = dislikes;

      if (type === "like") {
        if (userVote === "like") {
          setLikes(likes - 1);
          setUserVote(null);
        } else {
          setLikes(likes + 1);
          if (userVote === "dislike") setDislikes(dislikes - 1);
          setUserVote("like");
        }
      } else {
        if (userVote === "dislike") {
          setDislikes(dislikes - 1);
          setUserVote(null);
        } else {
          setDislikes(dislikes + 1);
          if (userVote === "like") setLikes(likes - 1);
          setUserVote("dislike");
        }
      }

      try {
        const res = await fetch(`/api/vote`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({ content_id: contentId, vote_type: type }),
        });

        if (!res.ok) throw new Error(`Vote request failed: ${res.status}`);

        const data = await res.json();
        console.log("Vote result:", data);

        // ✅ Sync with server (ensure accurate count)
        await fetchCounts();
      } catch (err) {
        console.error("Error voting:", err);
        // ❌ Revert optimistic update if API fails
        setLikes(prevLikes);
        setDislikes(prevDislikes);
        setUserVote(previousVote);
      } finally {
        setLoading(false);
      }
    },
    [contentId, likes, dislikes, userVote, loading, fetchCounts, token, isAuthenticated]
  );

  return { likes, dislikes, userVote, loading, vote, fetchCounts };
}
