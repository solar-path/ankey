'use client'

import { Link } from '@tanstack/react-router'
import {
  Building2,
  DollarSign,
  FileText,
  HelpCircle,
  LayoutDashboard,
  Search,
  Settings,
  Shield,
  TrendingUp,
  Users
} from 'lucide-react'
import * as React from 'react'

import { NavMain } from '@/components/QSideBar/nav-main'
import { NavSecondary } from '@/components/QSideBar/nav-secondary'
import { NavUser } from '@/components/QSideBar/nav-user'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar'

const data = {
  navMain: [
    {
      title: 'Dashboard',
      url: '/dashboard',
      icon: LayoutDashboard,
    },
    {
      title: 'Pricing Admin',
      url: '/pricing-admin',
      icon: DollarSign,
    },
    {
      title: 'Tenants',
      url: '/tenants',
      icon: Building2,
    },
    {
      title: 'Users',
      url: '/users',
      icon: Users,
    },
    {
      title: 'Analytics',
      url: '/analytics',
      icon: TrendingUp,
    },
    {
      title: 'Security',
      url: '/security',
      icon: Shield,
    },
    {
      title: 'Reports',
      url: '/reports',
      icon: FileText,
    },
  ],
  navSecondary: [
    {
      title: 'Settings',
      url: '/settings',
      icon: Settings,
    },
    {
      title: 'Help',
      url: '/help',
      icon: HelpCircle,
    },
    {
      title: 'Search',
      url: '/search',
      icon: Search,
    },
  ],
}

export function CoreSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild className="data-[slot=sidebar-menu-button]:!p-1.5">
              <Link to="/dashboard">
                <div className="w-6 h-6 bg-blue-600 rounded-lg flex items-center justify-center">
                  <span className="text-xs font-bold text-white">A</span>
                </div>
                <span className="text-base font-semibold">Ankey Admin</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
        <NavSecondary items={data.navSecondary} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
        <NavUser />
      </SidebarFooter>
    </Sidebar>
  )
}
