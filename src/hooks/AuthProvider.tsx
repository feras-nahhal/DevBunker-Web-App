"use client";

import { createContext, useContext, ReactNode } from "react";
import { useAuth } from "@/hooks/useAuth";
import { User } from "@/types/user"; // ✅ shared type

// ✅ Match exactly what useAuth() returns
interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  error: string | null;
  register: (email: string, password: string) => Promise<boolean>;
  login: (email: string, password: string) => Promise<User | null>;
  logout: () => Promise<void>;
  getCurrentUser: () => Promise<void>;
  isAuthenticated: boolean;
}

// ✅ Define context with correct type
const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const auth = useAuth(); // includes all values from your hook
  return <AuthContext.Provider value={auth}>{children}</AuthContext.Provider>;
};

// ✅ Safe custom hook to consume auth context
export const useAuthContext = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuthContext must be used within an AuthProvider");
  }
  return context;
};
