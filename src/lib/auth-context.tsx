/**
 * Legacy auth context - now wraps Zustand store for backward compatibility
 * Use useAuthStore directly in new code
 */
import React, { createContext, useContext, useEffect } from "react";
import { useAuthStore } from "@/modules/shared/stores";

export interface User {
  _id: string;
  id?: string; // Alias for _id for compatibility
  email: string;
  fullname: string;
  verified: boolean;
  avatar?: string;
  profile?: {
    avatar?: string;
    dob?: string;
    gender?: string;
  };
}

interface Session {
  token: string;
  expiresAt: number;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (user: User, session: Session) => void;
  logout: () => Promise<void>;
  refreshAuth: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const store = useAuthStore();

  // Initialize on mount
  useEffect(() => {
    store.initialize();
  }, []);

  const value: AuthContextType = {
    user: store.user as User | null,
    session: store.session,
    isAuthenticated: store.isAuthenticated,
    isLoading: store.isLoading,
    login: (user, session) => {
      // Add id as alias for _id
      const userWithId = { ...user, id: user._id };
      store.login(userWithId, session);
    },
    logout: store.logout,
    refreshAuth: store.refreshAuth,
    refreshUser: store.refreshAuth, // Alias for refreshAuth
  };

  return (
    <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
