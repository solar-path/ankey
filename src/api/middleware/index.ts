// Core admin authentication middleware
export { requireCoreAuth, optionalCoreAuth, requireLoggedIn } from './core-auth.middleware'

// Tenant user authentication middleware
export {
  requireTenantAuth,
  optionalTenantAuth,
  requireTenantLoggedIn,
} from './tenant-auth.middleware'

// Types
export type { AuthContext, AuthResult } from './auth.types'
