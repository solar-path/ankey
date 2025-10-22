import React, { createContext, useContext, useState, useEffect } from "react";
import { AuthService } from "./auth-service";
import { initializeDatabases, setupSync } from "./db";

export interface User {
  _id: string;
  id?: string;  // Alias for _id for compatibility
  email: string;
  fullname: string;
  verified: boolean;
  avatar?: string;
  profile?: {
    avatar?: string;
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
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const isAuthenticated = !!user && !!session;

  // Initialize databases on mount
  useEffect(() => {
    const init = async () => {
      await initializeDatabases();
      setupSync();
    };
    init();
  }, []);

  // Check for existing session on mount
  useEffect(() => {
    const checkSession = async () => {
      try {
        const token = localStorage.getItem("sessionToken");
        if (token) {
          const result = await AuthService.verifySession(token);
          setUser(result.user as User);
          setSession(result.session);
        }
      } catch (error) {
        console.error("Session verification failed:", error);
        localStorage.removeItem("sessionToken");
      } finally {
        setIsLoading(false);
      }
    };

    checkSession();
  }, []);

  const login = (newUser: User, newSession: Session) => {
    // Add id as alias for _id
    const userWithId = { ...newUser, id: newUser._id };
    setUser(userWithId);
    setSession(newSession);
    localStorage.setItem("sessionToken", newSession.token);
  };

  const logout = async () => {
    try {
      if (session?.token) {
        await AuthService.signOut(session.token);
      }
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      setUser(null);
      setSession(null);
      localStorage.removeItem("sessionToken");
    }
  };

  const refreshAuth = async () => {
    try {
      const token = localStorage.getItem("sessionToken");
      if (token) {
        const result = await AuthService.verifySession(token);
        setUser(result.user as User);
        setSession(result.session);
      }
    } catch (error) {
      console.error("Auth refresh failed:", error);
      setUser(null);
      setSession(null);
      localStorage.removeItem("sessionToken");
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        isAuthenticated,
        isLoading,
        login,
        logout,
        refreshAuth,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
