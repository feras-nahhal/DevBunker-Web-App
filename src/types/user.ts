// src/types/user.ts
import { USER_ROLES, USER_STATUS } from "@/lib/enums";

export interface User {
  id: string;
  email: string;
  role: USER_ROLES;
  status: USER_STATUS;
  created_at?: string;
  updated_at?: string;
}

export interface UserProfile extends User {
  // Extend with optional data like name, avatar, bio (if added later)
  name?: string;
  avatar_url?: string;
  bio?: string;
}

export interface AuthUser {
  id: string;
  email: string;
  role: USER_ROLES;
  token?: string; // for frontend use
}
