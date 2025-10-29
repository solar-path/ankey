import { create } from "zustand";
import { persist } from "zustand/middleware";
import { AuthService } from "@/modules/auth/auth-service";
import type { User } from "@/modules/shared/types/database.types";

interface AuthState {
  user: Omit<User, "password" | "verificationCode" | "resetToken"> | null;
  session: { token: string; expiresAt: number } | null;
  isAuthenticated: boolean;
  isLoading: boolean;

  // Actions
  login: (user: any, session: { token: string; expiresAt: number }) => void;
  logout: () => Promise<void>;
  refreshAuth: () => Promise<void>;
  initialize: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      session: null,
      isAuthenticated: false,
      isLoading: true,

      login: (user, session) => {
        localStorage.setItem("sessionToken", session.token);
        localStorage.setItem("userId", user._id);
        set({
          user,
          session,
          isAuthenticated: true,
          isLoading: false,
        });
      },

      logout: async () => {
        const { session } = get();
        if (session) {
          try {
            await AuthService.signOut(session.token);
          } catch (error) {
            console.error("Error signing out:", error);
          }
        }
        localStorage.removeItem("sessionToken");
        localStorage.removeItem("userId");
        localStorage.removeItem("ankey_active_company_id");
        set({
          user: null,
          session: null,
          isAuthenticated: false,
          isLoading: false,
        });
      },

      refreshAuth: async () => {
        let token = localStorage.getItem("sessionToken");

        // If no token in localStorage, try to get it from persisted Zustand state
        if (!token) {
          const { session } = get();
          if (session?.token) {
            token = session.token;
            // Restore to localStorage for CompanyProvider compatibility
            localStorage.setItem("sessionToken", token);
          }
        }

        if (!token) {
          set({ isLoading: false, isAuthenticated: false });
          return;
        }

        try {
          const result = await AuthService.verifySession(token);

          // Ensure localStorage is in sync
          localStorage.setItem("sessionToken", result.session.token);
          localStorage.setItem("userId", result.user._id);

          set({
            user: result.user,
            session: result.session,
            isAuthenticated: true,
            isLoading: false,
          });
        } catch (error) {
          console.error("Session verification failed:", error);
          localStorage.removeItem("sessionToken");
          localStorage.removeItem("userId");
          set({
            user: null,
            session: null,
            isAuthenticated: false,
            isLoading: false,
          });
        }
      },

      initialize: async () => {
        try {
          // Check for existing session (PostgreSQL handles all data persistence)
          await get().refreshAuth();
        } catch (error) {
          console.error("Failed to initialize auth:", error);
          set({ isLoading: false });
        }
      },
    }),
    {
      name: "auth-storage",
      partialize: (state) => ({
        // Only persist session token (user data will be refreshed)
        session: state.session,
      }),
    }
  )
);
