'use client'

import { Link } from '@tanstack/react-router'
import { BarChart3, LayoutDashboard, Package, Settings, ShoppingCart, Users } from 'lucide-react'
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
      url: '/tenantDashboard',
      icon: LayoutDashboard,
    },
    {
      title: 'Products',
      url: '/products',
      icon: Package,
    },
    {
      title: 'Orders',
      url: '/orders',
      icon: ShoppingCart,
    },
    {
      title: 'Customers',
      url: '/customers',
      icon: Users,
    },
    {
      title: 'Analytics',
      url: '/analytics',
      icon: BarChart3,
    },
  ],
  navSecondary: [
    {
      title: 'Settings',
      url: '/settings',
      icon: Settings,
    },
  ],
}

export function TenantSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild className="data-[slot=sidebar-menu-button]:!p-1.5">
              <Link to="/tenantDashboard">
                <span className="text-base font-semibold">Workspace</span>
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