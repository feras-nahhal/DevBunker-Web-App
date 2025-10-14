"use client";

import { useState, useEffect, useCallback } from "react";
import { NOTIFICATION_TYPES } from "@/lib/enums";

interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: NOTIFICATION_TYPES;
  read: boolean;
  created_at: string;
}

interface NotificationAPI {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: string; // plain string from DB
  read: boolean;
  created_at: string;
}


interface UseNotificationsOptions {
  autoFetch?: boolean;
}

export function useNotifications({ autoFetch = true }: UseNotificationsOptions = {}) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const getToken = useCallback(() => {
    if (typeof window === "undefined") return null;
    return localStorage.getItem("token") || null;
  }, []);

  /** 🟢 Fetch all notifications (GET /api/notifications) */
  const fetchNotifications = useCallback(async () => {
    if (typeof window === "undefined") return;
    try {
      setLoading(true);
      setError(null);
      const token = getToken();
      if (!token) throw new Error("Authentication required");

      const res = await fetch("/api/notifications", {
        method: "GET",
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);

      const json = await res.json();
      if (!json.success) throw new Error(json.error || "Failed to fetch notifications");

      const mapped: Notification[] = (json.notifications as NotificationAPI[]).map((n) => ({
        ...n,
        type: n.type as NOTIFICATION_TYPES, // safely cast to enum
      }));


      setNotifications(mapped);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Unknown fetch error";
      setError(msg);
      setNotifications([]);
      console.error("useNotifications fetch error:", err);
    } finally {
      setLoading(false);
    }
  }, [getToken]);

  /** ✅ Mark single notification as read (PUT /api/notifications/[id]/read) */
  const markAsRead = useCallback(
    async (notificationId: string) => {
      if (typeof window === "undefined") throw new Error("Cannot update on server");
      const token = getToken();
      if (!token) throw new Error("Authentication required");

      try {
        setLoading(true);
        setError(null);

        const res = await fetch(`/api/notifications/${notificationId}/read`, {
          method: "PUT",
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);

        const json = await res.json();
        if (!json.success) throw new Error(json.error || "Failed to mark notification as read");

        await fetchNotifications(); // refresh list
        return json.notification;
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Unknown mark-as-read error";
        setError(msg);
        console.error("markAsRead error:", err);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [fetchNotifications, getToken]
  );

  /** ✅ Mark all notifications as read (PUT /api/notifications/mark-all-read) */
  const markAllAsRead = useCallback(async () => {
    if (typeof window === "undefined") throw new Error("Cannot update on server");
    const token = getToken();
    if (!token) throw new Error("Authentication required");

    try {
      setLoading(true);
      setError(null);

      const res = await fetch("/api/notifications/mark-all-read", {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);

      const json = await res.json();
      if (!json.success) throw new Error(json.error || "Failed to mark all notifications as read");

      await fetchNotifications(); // refresh list
      return json;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Unknown mark-all-read error";
      setError(msg);
      console.error("markAllAsRead error:", err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [fetchNotifications, getToken]);

  useEffect(() => {
    if (typeof window === "undefined" || !autoFetch) return;
    fetchNotifications();
  }, [fetchNotifications, autoFetch]);

  return {
    notifications,
    loading,
    error,
    refetch: fetchNotifications,
    markAsRead,
    markAllAsRead,
  };
}
