import { client, handleApiResponse } from '@/lib/rpc'
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'

interface User {
  id: string
  email: string
  fullName: string | null
  avatar: string | null
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

  // Auto-detect tenant context from URL
  const detectTenantContext = () => {
    if (typeof window !== 'undefined') {
      const hostname = window.location.hostname
      const subdomain = hostname.split('.')[0]
      // Check if we're on a tenant subdomain (not localhost, www, or core domains)
      return !['localhost', 'www', 'api', 'core'].includes(subdomain) && subdomain !== hostname
    }
    return false
  }

  const checkAuth = async () => {
    setIsLoading(true)
    try {
      const isTenant = detectTenantContext()

      // Use appropriate auth endpoint based on context
      const response = isTenant
        ? await client['tenant-auth'].me.$get()
        : await client.auth.me.$get()

      if (response.ok) {
        const result = await response.json()
        if (result.success && result.data) {
          setUser(result.data as User)
        } else {
          setUser(null)
        }
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
      const isTenant = detectTenantContext()

      // Use appropriate login endpoint based on context
      const response = isTenant
        ? await client['tenant-auth'].login.$post({
            json: { email, password, twoFactorCode: twoFactorCode || '' },
          })
        : await client.auth.login.$post({
            json: { email, password, twoFactorCode: twoFactorCode || '' },
          })

      if (response.ok) {
        const result = await response.json()
        if (result.success && result.data) {
          setUser(result.data as User)
          return { success: true }
        } else {
          return { success: false, error: result.error || 'Login failed' }
        }
      } else {
        const result = await response.json()
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
      const isTenant = detectTenantContext()

      // Use appropriate logout endpoint based on context
      if (isTenant) {
        await client['tenant-auth'].logout.$post()
      } else {
        await client.auth.logout.$post()
      }
    } catch (error) {
      console.error('Logout error:', error)
    } finally {
      setUser(null)
      // Navigation should be handled by the component that calls logout
      // We'll emit a custom event that components can listen to
      window.dispatchEvent(new CustomEvent('auth:logout'))
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
