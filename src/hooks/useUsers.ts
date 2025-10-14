"use client";

import { useState, useEffect, useCallback } from "react";
import { User } from "@/types/user"; // Your User type
import { USER_STATUS,USER_ROLES } from "@/lib/enums"; // For validation


interface UseUsersOptions {
  autoFetch?: boolean;
 
}

interface AuthResult {
  success: boolean;
  user?: User;
  error?: string;
  token?: string;
}



export function useUsers({ autoFetch = true }: UseUsersOptions = {}) {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState<boolean>(false); // Start false; set on fetch
  const [error, setError] = useState<string | null>(null);

  // FIXED: SSR-safe token getter
  const getToken = useCallback(() => {
    if (typeof window === "undefined") return null;
    return localStorage.getItem("token") || null;
  }, []);

  /** 🟢 Fetch users list (GET /api/admin/users) */
  const fetchUsers = useCallback(async () => {
    if (typeof window === "undefined") return; // FIXED: Client-only
    try {
      setLoading(true);
      setError(null);
      const token = getToken();
      if (!token) throw new Error("Authentication required (no token)");

      const res = await fetch("/api/admin/users", {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store", // FIXED: Fresh data
      });

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      }

      const json = await res.json();
      if (!json.success) throw new Error(json.error || "Failed to fetch users");
      setUsers(json.users || []);
      console.log("Users fetched:", json.users?.length || 0); // Debug (remove in prod)
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : "Unknown fetch error";
      setError(errMsg);
      console.error("useUsers fetch error:", err);
      setUsers([]); // Clear on error
    } finally {
      setLoading(false);
    }
  }, [getToken]);

  /** 🔴 Delete user (DELETE /api/admin/users/[id]) */
  const deleteUser = useCallback(
    async (userId: string) => {
      if (typeof window === "undefined") throw new Error("Cannot delete on server");
      const token = getToken();
      if (!token) throw new Error("Authentication required");

      try {
        setLoading(true);
        const res = await fetch(`/api/admin/users/${userId}`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!res.ok) {
          throw new Error(`HTTP ${res.status}: ${res.statusText}`);
        }

        const json = await res.json();
        if (!json.success) throw new Error(json.error || "Failed to delete user");

        await fetchUsers(); // Refetch list
        console.log("User deleted:", userId); // Debug
        return true;
      } catch (err: unknown) {
        const errMsg = err instanceof Error ? err.message : "Unknown delete error";
        setError(errMsg);
        console.error("deleteUser error:", err);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [fetchUsers, getToken]
  );


  /** ➕ Create new user with role */
  const createUser = useCallback(
    async (email: string, password: string, role: USER_ROLES = USER_ROLES.CONSUMER) => {
      const token = getToken();
      if (!token) {
        setError("Authentication required");
        return false;
      }

      // Validate role
      const userRole = Object.values(USER_ROLES).includes(role) ? role : USER_ROLES.CONSUMER;

      try {
        setLoading(true);
        setError(null);
        const res = await fetch("/api/admin/users", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ email, password, role: userRole }),
        });

        const data: AuthResult = await res.json();
        if (!data.success) {
          setError(data.error || "Failed to create user");
          return false;
        }

        await fetchUsers(); // Refresh users list
        return true;
      } catch (err: unknown) {
        const errMsg = err instanceof Error ? err.message : "Unknown network error";
        setError(errMsg);
        return false;
      } finally {
        setLoading(false);
      }
    },
    [fetchUsers, getToken]
  );

  

  /** 🟡 Update user status (PUT /api/admin/users/[id]/status) */
  const updateUserStatus = useCallback(
    async (userId: string, newStatus: USER_STATUS) => {
      if (typeof window === "undefined") throw new Error("Cannot update on server");
      const token = getToken();
      if (!token) throw new Error("Authentication required");

      // Validate status (from your ALLOWED_STATUS)
      const allowedStatuses = ["active", "banned", "pending", "rejected"] as const;
      if (!allowedStatuses.includes(newStatus)) {
        throw new Error(`Invalid status: ${newStatus}`);
      }

      try {
        setLoading(true);
        const res = await fetch(`/api/admin/users/${userId}/status`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ status: newStatus }),
        });

        if (!res.ok) {
          throw new Error(`HTTP ${res.status}: ${res.statusText}`);
        }

        const json = await res.json();
        if (!json.success) throw new Error(json.error || "Failed to update status");

        await fetchUsers(); // Refetch list
        console.log("User status updated:", userId, "→", newStatus); // Debug
        return json.user; // Return updated user
      } catch (err: unknown) {
        const errMsg = err instanceof Error ? err.message : "Unknown update error";
        setError(errMsg);
        console.error("updateUserStatus error:", err);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [fetchUsers, getToken]
  );

  /** ♻️ Auto-fetch on mount (client-only) */
  useEffect(() => {
    if (typeof window === "undefined" || !autoFetch) return;
    fetchUsers();
  }, [fetchUsers, autoFetch]);

  return {
    users,
    loading,
    error,
    refetch: fetchUsers,
    createUser,
    deleteUser,
    updateUserStatus,
  };
}