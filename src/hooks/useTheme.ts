import { client } from '@/lib/rpc'
import { useEffect, useState } from 'react'

type Theme = 'light' | 'dark'

interface UseThemeReturn {
  theme: Theme
  setTheme: (theme: Theme) => void
  loading: boolean
}

export function useTheme(): UseThemeReturn {
  const [theme, setThemeState] = useState<Theme>('light')
  const [loading, setLoading] = useState(true)

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

  // Apply theme to document
  const applyTheme = (newTheme: Theme) => {
    const root = document.documentElement
    if (newTheme === 'dark') {
      root.classList.add('dark')
    } else {
      root.classList.remove('dark')
    }
  }

  // Load theme from user settings on mount
  useEffect(() => {
    const loadTheme = async () => {
      try {
        const isTenant = detectTenantContext()
        
        // Use appropriate settings endpoint based on context
        const response = isTenant 
          ? await client['tenant-settings'].me.$get()
          : await client.settings.me.$get()
          
        if (response.ok) {
          const data = await response.json()
          if (data.success && data.data?.appearance?.theme) {
            const userTheme = data.data.appearance.theme as Theme
            setThemeState(userTheme)
            applyTheme(userTheme)
          } else {
            // Default to light theme
            setThemeState('light')
            applyTheme('light')
          }
        } else {
          // If not authenticated or error, default to light theme
          setThemeState('light')
          applyTheme('light')
        }
      } catch (error) {
        // If error (e.g., not authenticated), default to light theme
        console.warn('Failed to load user theme, defaulting to light:', error)
        setThemeState('light')
        applyTheme('light')
      } finally {
        setLoading(false)
      }
    }

    loadTheme()
  }, [])

  // Set theme and save to user settings
  const setTheme = async (newTheme: Theme) => {
    try {
      setThemeState(newTheme)
      applyTheme(newTheme)

      const isTenant = detectTenantContext()
      
      // Save to appropriate settings endpoint based on context
      if (isTenant) {
        await client['tenant-settings'].appearance.$patch({
          json: { theme: newTheme },
        })
      } else {
        await client.settings.appearance.$patch({
          json: { theme: newTheme },
        })
      }
    } catch (error) {
      console.error('Failed to save theme setting:', error)
      // Still apply the theme locally even if save fails
    }
  }

  return {
    theme,
    setTheme,
    loading,
  }
}
