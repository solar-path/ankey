import { hc } from 'hono/client';
import type { AppType } from '@/api/api';

// Create type-safe RPC client
const baseUrl = import.meta.env.DEV 
  ? 'http://localhost:3001' 
  : window.location.origin;

export const rpc = hc<AppType>(baseUrl, {
  headers: {
    'Content-Type': 'application/json',
  },
  init: {
    credentials: 'include', // Include cookies for authentication
  },
});

// Export individual API modules for easier imports
export const coreAuth = (rpc as any).api.rpc.core.auth;
export const coreTenants = (rpc as any).api.rpc.core.tenants;
export const tenantAuth = (rpc as any).api.rpc.tenant.auth;
export const tenantRBAC = (rpc as any).api.rpc.tenant.rbac;

// Helper function to handle API responses
export const handleApiResponse = async <T>(response: Response): Promise<{
  success: boolean;
  data?: T;
  error?: string;
}> => {
  try {
    const data = await response.json();
    return {
      success: response.ok,
      data: response.ok ? data : undefined,
      error: response.ok ? undefined : data.error || 'An error occurred',
    };
  } catch (error) {
    return {
      success: false,
      error: 'Failed to parse response',
    };
  }
};