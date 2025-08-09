import type { AppType } from '@/api/api'
import { hc } from 'hono/client'

// Create type-safe RPC client following BetterNews pattern
// Note: Using 'as any' due to Hono's complex type inference with our multi-tenant setup
export const client = (hc<AppType>("/", {
  fetch: (input: RequestInfo | URL, init?: RequestInit) =>
    fetch(input, {
      ...init,
      credentials: 'include',
    }),
}) as any).api

// Dashboard-specific API calls - now using clean client structure
export const dashboardApi = {
  getStats: () => client.tenants.stats.dashboard.$get(),
  getRecentTenants: (limit?: number) =>
    client.tenants.recent.$get({ query: limit ? { limit: limit.toString() } : {} }),
  getSystemActivity: (limit?: number) =>
    client.tenants.activity.$get({ query: limit ? { limit: limit.toString() } : {} }),
}

// Helper function to handle API responses
export const handleApiResponse = async <T>(
  response: Response
): Promise<{
  success: boolean
  data?: T
  error?: string
}> => {
  try {
    const data = await response.json()
    return {
      success: response.ok,
      data: response.ok ? data : undefined,
      error: response.ok ? undefined : data.error || 'An error occurred',
    }
  } catch (error) {
    return {
      success: false,
      error: 'Failed to parse response',
    }
  }
}
