"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuthContext } from "./AuthProvider";


export type VoteType = "like" | "dislike";

interface VoteState {
  likes: number;
  dislikes: number;
  userVote: VoteType | null;
}

export function useVotes(contentId: string) {
  const { token} = useAuthContext();
  const [votes, setVotes] = useState<VoteState>({
    likes: 0,
    dislikes: 0,
    userVote: null,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /** Fetch votes */
  const fetchVotes = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const res = await fetch(`/api/vote?content_id=${contentId}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error || "Failed to fetch votes");

      setVotes({
        likes: json.likes,
        dislikes: json.dislikes,
        userVote: json.userVote || null,
      });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, [contentId, token]);

  /** Vote action */
  const vote = useCallback(
    async (type: VoteType) => {
      try {
        setLoading(true);

        const res = await fetch(`/api/vote`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({ content_id: contentId, vote_type: type }),
        });

        const json = await res.json();
        if (!res.ok || !json.success) throw new Error(json.error || "Failed to vote");

        // Refetch votes after action
        await fetchVotes();
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setLoading(false);
      }
    },
    [contentId, token, fetchVotes]
  );

  useEffect(() => {
    fetchVotes();
  }, [fetchVotes]);

  return { votes, vote, loading, error, refetch: fetchVotes };
}
