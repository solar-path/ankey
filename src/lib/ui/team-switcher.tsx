"use client"

import * as React from "react"
import { Plus } from "lucide-react"
import { Link } from "wouter"

import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/lib/ui/sidebar"
import { useCompanyOptional } from "@/lib/company-context"

interface Company {
  id: string
  title: string // Using 'title' to match companies table schema
  logo?: string
  logoComponent?: React.ElementType
}

export function TeamSwitcher({
  companies,
}: {
  companies: Company[]
  onCompanyChange?: (companyId: string) => void
}) {
  // Get activeCompany from context instead of local state
  const companyContext = useCompanyOptional()
  const activeCompany = companyContext?.activeCompany || null

  // Debug logging - track component re-renders
  React.useEffect(() => {
    console.log("[TeamSwitcher] Re-render - companies:", companies?.length || 0, companies)
    console.log("[TeamSwitcher] Active company:", activeCompany?.title || "none", activeCompany)
  }, [companies, activeCompany])

  // Scenario 1: No company exists - show "Create Company" button
  if (!companies || companies.length === 0) {
    console.log("[TeamSwitcher] Rendering: Create Company button")
    return (
      <SidebarMenu>
        <SidebarMenuItem>
          <Link href="/company/new">
            <SidebarMenuButton
              size="lg"
              className="w-full hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
            >
              <div className="flex aspect-square size-8 items-center justify-center rounded-lg border bg-transparent">
                <Plus className="size-4" />
              </div>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">Create Company</span>
                <span className="truncate text-xs text-muted-foreground">Get started</span>
              </div>
            </SidebarMenuButton>
          </Link>
        </SidebarMenuItem>
      </SidebarMenu>
    )
  }

  // Scenario 2: Company exists - show company logo, name, and "Enterprise" plan (non-interactive)
  console.log("[TeamSwitcher] Rendering: Company display for", activeCompany?.title)
  if (!activeCompany) {
    return null
  }

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        {/* Non-interactive display - dropdown commented out */}
        <SidebarMenuButton
          size="lg"
          className="cursor-default"
        >
          <div className="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg overflow-hidden">
            {activeCompany.logo ? (
              <img src={activeCompany.logo} alt={activeCompany.title} className="size-8 object-cover" />
            ) : (
              <span className="text-sm font-semibold">{activeCompany.title.charAt(0)}</span>
            )}
          </div>
          <div className="grid flex-1 text-left text-sm leading-tight">
            <span className="truncate font-medium">{activeCompany.title}</span>
            <span className="truncate text-xs text-muted-foreground">Enterprise</span>
          </div>
          {/* <ChevronsUpDown className="ml-auto" /> - removed for non-interactive state */}
        </SidebarMenuButton>

        {/* Dropdown menu commented out - will be activated later for multi-company switching */}
        {/*
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <div className="flex aspect-square size-8 items-center justify-center rounded-lg overflow-hidden bg-gray-100">
                {activeCompany.logo ? (
                  <img src={activeCompany.logo} alt={activeCompany.title} className="size-8 object-cover" />
                ) : (
                  <span className="text-sm font-semibold text-gray-500">{activeCompany.title.charAt(0)}</span>
                )}
              </div>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">{activeCompany.title}</span>
                <span className="truncate text-xs">Enterprise</span>
              </div>
              <ChevronsUpDown className="ml-auto" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
            align="start"
            side={isMobile ? "bottom" : "right"}
            sideOffset={4}
          >
            <div className="p-2">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 size-4 text-muted-foreground" />
                <Input
                  placeholder="Search companies..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="h-9 pl-8"
                />
              </div>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuLabel className="text-muted-foreground text-xs">
              Companies
            </DropdownMenuLabel>
            {filteredCompanies.length > 0 ? (
              filteredCompanies.map((company, index) => (
                <DropdownMenuItem
                  key={company.id}
                  onClick={() => handleCompanyChange(company)}
                  className="gap-2 p-2"
                >
                  <div className="flex size-6 items-center justify-center rounded-md overflow-hidden bg-gray-100">
                    {company.logo ? (
                      <img src={company.logo} alt={company.title} className="size-6 object-cover" />
                    ) : (
                      <span className="text-xs font-semibold text-gray-500">{company.title.charAt(0)}</span>
                    )}
                  </div>
                  {company.title}
                  <DropdownMenuShortcut>⌘{index + 1}</DropdownMenuShortcut>
                </DropdownMenuItem>
              ))
            ) : (
              <DropdownMenuItem disabled className="text-center text-muted-foreground">
                No companies found
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            <Link href="/company/new">
              <DropdownMenuItem className="gap-2 p-2">
                <div className="flex size-6 items-center justify-center rounded-md border bg-transparent">
                  <Plus className="size-4" />
                </div>
                <div className="font-medium text-muted-foreground">Add company</div>
              </DropdownMenuItem>
            </Link>
          </DropdownMenuContent>
        </DropdownMenu>
        */}
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
