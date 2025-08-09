import { cn } from '@/lib/utils'
import { createFileRoute, Link, Outlet, useLocation } from '@tanstack/react-router'
import { Contact, Lock, Palette, Settings, Shield, User } from 'lucide-react'

export const Route = createFileRoute('/_core/settings')({
  component: SettingsLayout,
})

const settingsNavigation = [
  {
    name: 'Profile',
    href: '/settings/profile',
    icon: User,
    description: 'Manage your profile information',
  },
  {
    name: 'Personal',
    href: '/settings/personal',
    icon: Settings,
    description: 'Personal details and preferences',
  },
  {
    name: 'Contacts',
    href: '/settings/contacts',
    icon: Contact,
    description: 'Contact information and emergency contacts',
  },
  {
    name: 'Password',
    href: '/settings/password',
    icon: Lock,
    description: 'Change your password and security settings',
  },
  {
    name: 'Appearance',
    href: '/settings/appearance',
    icon: Palette,
    description: 'Customize your interface and theme',
  },
  {
    name: 'Roles',
    href: '/settings/roles',
    icon: Shield,
    description: 'Manage roles and permissions',
  },
]

function SettingsLayout() {
  const location = useLocation()
  const currentPath = location.pathname

  return (
    <div className="flex-1 overflow-hidden">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="px-6 py-4">
          <div className="flex items-center">
            <Settings className="h-6 w-6 mr-3 text-gray-600" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Account Settings</h1>
              <p className="text-gray-600">Manage your account preferences and security</p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex h-full">
        {/* Settings Navigation */}
        <div className="w-64 bg-gray-50 border-r border-gray-200 p-6">
          <nav className="space-y-2">
            {settingsNavigation.map(item => {
              const isActive =
                currentPath === item.href ||
                (currentPath === '/settings' && item.href === '/settings/profile')

              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={cn(
                    'flex items-start p-3 rounded-lg text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-blue-50 text-blue-700 border border-blue-200'
                      : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                  )}
                >
                  <item.icon
                    className={cn(
                      'h-5 w-5 mr-3 mt-0.5 flex-shrink-0',
                      isActive ? 'text-blue-600' : 'text-gray-500'
                    )}
                  />
                  <div>
                    <div className="font-medium">{item.name}</div>
                    <div
                      className={cn('text-xs mt-1', isActive ? 'text-blue-600' : 'text-gray-500')}
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
