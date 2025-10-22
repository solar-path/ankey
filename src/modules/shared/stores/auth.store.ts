import { create } from "zustand";
import { persist } from "zustand/middleware";
import { AuthService } from "@/modules/auth/auth-service";
import { type User, type Session, initializeDatabases, setupSync } from "@/modules/shared/database/db";

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
        set({
          user: null,
          session: null,
          isAuthenticated: false,
          isLoading: false,
        });
      },

      refreshAuth: async () => {
        const token = localStorage.getItem("sessionToken");
        if (!token) {
          set({ isLoading: false, isAuthenticated: false });
          return;
        }

        try {
          const result = await AuthService.verifySession(token);
          set({
            user: result.user,
            session: result.session,
            isAuthenticated: true,
            isLoading: false,
          });
        } catch (error) {
          console.error("Session verification failed:", error);
          localStorage.removeItem("sessionToken");
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
          // Initialize databases
          await initializeDatabases();

          // Setup sync
          setupSync();

          // Check for existing session
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
