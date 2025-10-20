"use client";

import { createContext, useContext, ReactNode } from "react";
import { useAuth } from "@/hooks/useAuth";

interface AuthContextType {
  user: any;
  token: string | null;
  loading: boolean;
  login: Function;
  logout: Function;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const auth = useAuth(); // your existing useAuth hook

  return <AuthContext.Provider value={auth}>{children}</AuthContext.Provider>;
};

// Custom hook to consume context
export const useAuthContext = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuthContext must be used within AuthProvider");
  return context;
};
