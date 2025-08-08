import { Link, useLocation } from '@tanstack/react-router'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useAuth } from '@/contexts/AuthContext'
import { 
  LayoutDashboard, 
  DollarSign, 
  Users, 
  Building2, 
  Settings, 
  LogOut,
  User,
  Bell,
  Search,
  Shield,
  FileText,
  TrendingUp,
  ChevronDown,
  UserCog,
  Mail,
  Activity,
  HelpCircle,
  Moon,
  Sun
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useState } from 'react'

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Pricing Admin', href: '/pricing-admin', icon: DollarSign },
  { name: 'Tenants', href: '/tenants', icon: Building2 },
  { name: 'Users', href: '/users', icon: Users },
  { name: 'Analytics', href: '/analytics', icon: TrendingUp },
  { name: 'Security', href: '/security', icon: Shield },
  { name: 'Reports', href: '/reports', icon: FileText },
]

const bottomNavigation = [
  { name: 'Settings', href: '/settings', icon: Settings },
]

export function CoreSidebar() {
  const { user, logout } = useAuth()
  const location = useLocation()
  const [isCollapsed, setIsCollapsed] = useState(false)

  const handleLogout = async () => {
    await logout()
  }

  const toggleCollapse = () => {
    setIsCollapsed(!isCollapsed)
  }

  return (
    <div className={cn(
      "flex flex-col h-full bg-slate-900 text-white transition-all duration-300",
      isCollapsed ? "w-16" : "w-64"
    )}>
      {/* Logo */}
      <div className="flex items-center justify-between h-16 px-4 bg-slate-800 border-b border-slate-700">
        <Link to="/dashboard" className="flex items-center min-w-0">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
            <span className="text-sm font-bold">A</span>
          </div>
          {!isCollapsed && (
            <span className="ml-2 text-lg font-semibold truncate">Ankey</span>
          )}
        </Link>
        <Button
          variant="ghost"
          size="sm"
          onClick={toggleCollapse}
          className="text-slate-400 hover:text-white hover:bg-slate-700 flex-shrink-0"
        >
          <ChevronDown className={cn(
            "h-4 w-4 transition-transform duration-200",
            isCollapsed ? "rotate-90" : "rotate-0"
          )} />
        </Button>
      </div>

      {/* User Menu */}
      {user && (
        <div className="px-3 py-4 bg-slate-800 border-b border-slate-700">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="w-full justify-start text-left p-2 h-auto hover:bg-slate-700 transition-colors"
              >
                <div className="flex items-center space-x-3 min-w-0">
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-sm font-medium text-white">
                      {user.fullName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                    </span>
                  </div>
                  {!isCollapsed && (
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white truncate">
                        {user.fullName}
                      </p>
                      <p className="text-xs text-slate-400 truncate">
                        {user.email}
                      </p>
                    </div>
                  )}
                  {!isCollapsed && (
                    <ChevronDown className="w-4 h-4 text-slate-400 flex-shrink-0" />
                  )}
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent 
              align="start" 
              side={isCollapsed ? "right" : "bottom"}
              className="w-64 bg-white border border-slate-200 shadow-lg"
            >
              <DropdownMenuLabel className="text-slate-900">
                <div className="flex flex-col space-y-1">
                  <span className="font-medium">{user.fullName}</span>
                  <span className="text-xs text-slate-500">{user.email}</span>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-slate-700 hover:bg-slate-50">
                <UserCog className="mr-2 h-4 w-4" />
                Profile Settings
              </DropdownMenuItem>
              <DropdownMenuItem className="text-slate-700 hover:bg-slate-50">
                <Mail className="mr-2 h-4 w-4" />
                Email Preferences
              </DropdownMenuItem>
              <DropdownMenuItem className="text-slate-700 hover:bg-slate-50">
                <Activity className="mr-2 h-4 w-4" />
                Activity Log
              </DropdownMenuItem>
              <DropdownMenuItem className="text-slate-700 hover:bg-slate-50">
                <Bell className="mr-2 h-4 w-4" />
                Notifications
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-slate-700 hover:bg-slate-50">
                <HelpCircle className="mr-2 h-4 w-4" />
                Help & Support
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={handleLogout}
                className="text-red-600 hover:bg-red-50 focus:bg-red-50"
              >
                <LogOut className="mr-2 h-4 w-4" />
                Sign Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}

      {/* Main Navigation */}
      <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto">
        {navigation.map((item) => {
          const isActive = location.pathname === item.href
          return (
            <Link
              key={item.name}
              to={item.href}
              className={cn(
                'group flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-200',
                isActive
                  ? 'bg-blue-600 text-white shadow-lg'
                  : 'text-slate-300 hover:bg-slate-700 hover:text-white'
              )}
              title={isCollapsed ? item.name : undefined}
            >
              <item.icon
                className={cn(
                  'h-5 w-5 flex-shrink-0 transition-colors',
                  isActive ? 'text-white' : 'text-slate-400 group-hover:text-white',
                  isCollapsed ? 'mr-0' : 'mr-3'
                )}
              />
              {!isCollapsed && (
                <span className="truncate">{item.name}</span>
              )}
              {isActive && !isCollapsed && (
                <div className="ml-auto w-1 h-1 bg-white rounded-full" />
              )}
            </Link>
          )
        })}
      </nav>

      {/* Bottom Navigation & Actions */}
      <div className="px-2 pb-4 space-y-2 border-t border-slate-700 pt-4">
        {bottomNavigation.map((item) => {
          const isActive = location.pathname === item.href
          return (
            <Link
              key={item.name}
              to={item.href}
              className={cn(
                'group flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-200',
                isActive
                  ? 'bg-blue-600 text-white shadow-lg'
                  : 'text-slate-300 hover:bg-slate-700 hover:text-white'
              )}
              title={isCollapsed ? item.name : undefined}
            >
              <item.icon
                className={cn(
                  'h-5 w-5 flex-shrink-0 transition-colors',
                  isActive ? 'text-white' : 'text-slate-400 group-hover:text-white',
                  isCollapsed ? 'mr-0' : 'mr-3'
                )}
              />
              {!isCollapsed && (
                <span className="truncate">{item.name}</span>
              )}
            </Link>
          )
        })}

        {/* Quick Actions - Only show when not collapsed */}
        {!isCollapsed && (
          <div className="pt-2">
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider px-3 pb-2">
              Quick Actions
            </p>
            <div className="flex flex-wrap gap-1">
              <Button 
                variant="ghost" 
                size="sm" 
                className="text-slate-400 hover:text-white hover:bg-slate-700 flex-1"
                title="Search"
              >
                <Search className="h-4 w-4" />
              </Button>
              <Button 
                variant="ghost" 
                size="sm" 
                className="text-slate-400 hover:text-white hover:bg-slate-700 flex-1"
                title="Notifications"
              >
                <Bell className="h-4 w-4" />
              </Button>
              <Button 
                variant="ghost" 
                size="sm" 
                className="text-slate-400 hover:text-white hover:bg-slate-700 flex-1"
                title="Activity"
              >
                <Activity className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Collapsed Quick Actions */}
      {isCollapsed && (
        <div className="px-1 py-3 bg-slate-800 border-t border-slate-700">
          <div className="flex flex-col space-y-2">
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-slate-400 hover:text-white hover:bg-slate-700 w-full h-10"
              title="Search"
            >
              <Search className="h-4 w-4" />
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-slate-400 hover:text-white hover:bg-slate-700 w-full h-10"
              title="Notifications"
            >
              <Bell className="h-4 w-4" />
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-slate-400 hover:text-white hover:bg-slate-700 w-full h-10"
              title="Activity"
            >
              <Activity className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}