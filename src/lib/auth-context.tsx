/**
 * Legacy auth context - now wraps Zustand store for backward compatibility
 * Use useAuthStore directly in new code
 */
import React, { createContext, useContext, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useAuthStore } from "@/modules/shared/stores";
import { AuthService } from "@/modules/auth/auth-service";

export interface User {
  _id: string;
  id?: string; // Alias for _id for compatibility
  email: string;
  fullname: string;
  verified: boolean;
  avatar?: string;
  preferredLanguage?: string;
  profile?: {
    avatar?: string;
    dob?: string;
    gender?: string;
    preferredLanguage?: string;
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
  updateUserLanguage: (language: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const store = useAuthStore();
  const { i18n } = useTranslation();

  // Initialize on mount and apply user's preferred language
  useEffect(() => {
    store.initialize();
  }, []);

  // Apply user's preferred language when user loads
  useEffect(() => {
    if (store.user?.preferredLanguage || store.user?.profile?.preferredLanguage) {
      const userLanguage = store.user.preferredLanguage || store.user.profile?.preferredLanguage;
      if (userLanguage && i18n.language !== userLanguage) {
        console.log('[AuthProvider] Applying user preferred language:', userLanguage);
        i18n.changeLanguage(userLanguage);
      }
    }
  }, [store.user, i18n]);

  const updateUserLanguage = async (language: string) => {
    if (!store.user) {
      throw new Error('No user logged in');
    }

    // Call AuthService to update language in backend
    const updatedUser = await AuthService.updateLanguage(store.user._id, language);

    // Refresh user data from backend to get the updated language
    await store.refreshAuth();

    return updatedUser;
  };

  const value: AuthContextType = {
    user: store.user as User | null,
    session: store.session,
    isAuthenticated: store.isAuthenticated,
    isLoading: store.isLoading,
    login: (user, session) => {
      // Add id as alias for _id
      const userWithId = { ...user, id: user._id };
      store.login(userWithId, session);

      // Apply user's preferred language immediately on login
      if (user.preferredLanguage || user.profile?.preferredLanguage) {
        const userLanguage = user.preferredLanguage || user.profile?.preferredLanguage;
        console.log('[AuthProvider] Applying language on login:', userLanguage);
        i18n.changeLanguage(userLanguage);
      }
    },
    logout: store.logout,
    refreshAuth: store.refreshAuth,
    refreshUser: store.refreshAuth, // Alias for refreshAuth
    updateUserLanguage,
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
