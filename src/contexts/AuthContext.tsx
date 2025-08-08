import { coreAuth, handleApiResponse } from '@/lib/rpc'
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'

interface User {
  id: string
  email: string
  fullName: string | null
  isActive: boolean
  emailVerified: boolean
  twoFactorEnabled: boolean
}

interface AuthContextType {
  user: User | null
  isLoading: boolean
  isAuthenticated: boolean
  login: (
    email: string,
    password: string,
    twoFactorCode?: string
  ) => Promise<{ success: boolean; error?: string }>
  logout: () => Promise<void>
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const isAuthenticated = !!user

  const checkAuth = async () => {
    setIsLoading(true)
    try {
      const response = await coreAuth.me.$get()
      const result = await handleApiResponse(response)

      if (result.success && result.data) {
        setUser(result.data as User)
      } else {
        setUser(null)
      }
    } catch (error) {
      console.error('Auth check failed:', error)
      setUser(null)
    } finally {
      setIsLoading(false)
    }
  }

  const login = async (email: string, password: string, twoFactorCode?: string) => {
    try {
      const response = await coreAuth.login.$post({
        json: { email, password, twoFactorCode: twoFactorCode || '' },
      })

      const result = await handleApiResponse(response)

      if (result.success && result.data) {
        setUser(result.data as User)
        return { success: true }
      } else {
        return { success: false, error: result.error || 'Login failed' }
      }
    } catch (error) {
      console.error('Login error:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Login failed',
      }
    }
  }

  const logout = async () => {
    try {
      await coreAuth.logout.$post()
    } catch (error) {
      console.error('Logout error:', error)
    } finally {
      setUser(null)
    }
  }

  const refreshUser = async () => {
    await checkAuth()
  }

  useEffect(() => {
    checkAuth()
  }, [])

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated,
    login,
    logout,
    refreshUser,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
