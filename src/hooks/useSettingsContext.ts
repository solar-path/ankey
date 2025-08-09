import { useLocation } from '@tanstack/react-router'
import { client } from '@/lib/rpc'

export function useSettingsContext() {
  const location = useLocation()

  // Detect context based on current route or domain
  // For now, assume core context since _tenant/settings has been removed
  // This could be enhanced to detect subdomain or other tenant indicators
  const isTenantContext =
    location.pathname.includes('/_tenant') || window.location.hostname !== 'localhost'

  // Return the appropriate settings client based on the cleaned up RPC structure
  const settingsClient = isTenantContext ? client['tenant-settings'] : client.settings

  return {
    isTenantContext,
    settingsClient,
  }
}
