import type { User } from '@/shared'

// Extended Hono context for authentication
export interface AuthContext {
  Variables: {
    user?: User
    sessionId?: string
    tenant?: any
    tenantDatabase?: string
    isTenant?: boolean
  }
}

// Authentication result interface
export interface AuthResult {
  success: boolean
  user?: User
  session?: any
  error?: string
}