import { SiteHeader } from '@/components/QSideBar/site-header'
import { cn } from '@/lib/utils'
import { type BreadcrumbItem } from '@/shared'
import { createFileRoute, Link, Outlet, useLocation } from '@tanstack/react-router'
import { Contact, Lock, Palette, Settings, Shield, User } from 'lucide-react'
import { createContext, useContext } from 'react'

// Create context for breadcrumbs
export const BreadcrumbContext = createContext<BreadcrumbItem[]>([])
export const useBreadcrumbs = () => useContext(BreadcrumbContext)

export const Route = createFileRoute('/_core/account')({
  component: SettingsLayout,
})

const settingsNavigation = [
  {
    name: 'Profile',
    href: '/account/profile',
    icon: User,
    description: 'Manage your profile information',
  },
  {
    name: 'Personal',
    href: '/account/personal',
    icon: Settings,
    description: 'Personal details and preferences',
  },
  {
    name: 'Contacts',
    href: '/account/contacts',
    icon: Contact,
    description: 'Contact information and emergency contacts',
  },
  {
    name: 'Security',
    href: '/account/security',
    icon: Shield,
    description: 'Two-factor authentication and security settings',
  },
  {
    name: 'Password',
    href: '/account/password',
    icon: Lock,
    description: 'Change your password and security settings',
  },
  {
    name: 'Appearance',
    href: '/account/appearance',
    icon: Palette,
    description: 'Customize your interface and theme',
  },
  {
    name: 'Roles',
    href: '/account/roles',
    icon: Shield,
    description: 'Manage roles and permissions',
  },
]

function SettingsLayout() {
  const location = useLocation()
  const currentPath = location.pathname

  // Determine breadcrumbs based on current path
  const getBreadcrumbs = (): BreadcrumbItem[] => {
    const path = currentPath.split('/').filter(Boolean)
    const lastSegment = path[path.length - 1]

    const breadcrumbMap: Record<string, string> = {
      profile: 'Profile',
      personal: 'Personal',
      contacts: 'Contacts',
      security: 'Security',
      password: 'Password',
      appearance: 'Appearance',
      roles: 'Roles',
      account: 'Account',
    }

    const breadcrumbs: BreadcrumbItem[] = [{ title: 'Account', href: '/account' }]

    if (lastSegment && lastSegment !== 'account' && breadcrumbMap[lastSegment]) {
      breadcrumbs.push({
        title: breadcrumbMap[lastSegment],
        href: currentPath,
      })
    }

    return breadcrumbs
  }

  return (
    <div className="flex-1 overflow-hidden flex flex-col">
      {/* Site Header with breadcrumbs */}
      <SiteHeader breadcrumbs={getBreadcrumbs()} />

      <div className="flex h-full flex-1">
        {/* Settings Navigation */}
        <div className="w-64 dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 p-6">
          <nav className="space-y-2">
            {settingsNavigation.map(item => {
              const isActive =
                currentPath === item.href ||
                (currentPath === '/account' && item.href === '/account/profile')

              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={cn(
                    'flex items-start p-3 rounded-lg text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-100'
                  )}
                >
                  <item.icon
                    className={cn(
                      'h-5 w-5 mr-3 mt-0.5 flex-shrink-0',
                      isActive
                        ? 'text-blue-600 dark:text-blue-400'
                        : 'text-gray-500 dark:text-gray-400'
                    )}
                  />
                  <div>
                    <div className="font-medium">{item.name}</div>
                    <div
                      className={cn(
                        'text-xs mt-1',
                        isActive
                          ? 'text-blue-600 dark:text-blue-400'
                          : 'text-gray-500 dark:text-gray-400'
                      )}
                    >
                      {item.description}
                    </div>
                  </div>
                </Link>
              )
            })}
          </nav>
        </div>

        {/* Settings Content */}
        <div className="flex-1 overflow-auto p-6">
          <div className="max-w-4xl">
            <Outlet />
          </div>
        </div>
      </div>
    </div>
  )
}
