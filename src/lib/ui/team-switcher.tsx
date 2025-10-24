"use client"

import * as React from "react"
import { ChevronsUpDown, Plus, Search } from "lucide-react"
import { Link } from "wouter"

import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/lib/ui/sidebar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from "@/lib/ui/dropdown-menu"
import { Input } from "@/lib/ui/input"
import { useCompanyOptional, type Company } from "@/lib/company-context"
import { useIsMobile } from "@/hooks/use-mobile"

export function TeamSwitcher({
  companies,
}: {
  companies: Company[]
  onCompanyChange?: (companyId: string) => void
}) {
  const companyContext = useCompanyOptional()
  const activeCompany = companyContext?.activeCompany || null
  const isMobile = useIsMobile()

  const [searchTerm, setSearchTerm] = React.useState("")

  // Filter companies based on search term
  const filteredCompanies = React.useMemo(() => {
    if (!searchTerm.trim()) return companies
    return companies.filter(company =>
      company.title.toLowerCase().includes(searchTerm.toLowerCase())
    )
  }, [companies, searchTerm])

  // Handle company change
  const handleCompanyChange = React.useCallback(async (company: Company) => {
    if (companyContext?.switchCompany) {
      try {
        await companyContext.switchCompany(company._id)
        console.log("[TeamSwitcher] Switched to company:", company.title)
      } catch (error) {
        console.error("[TeamSwitcher] Failed to switch company:", error)
      }
    }
  }, [companyContext])

  // Debug logging
  React.useEffect(() => {
    console.log("[TeamSwitcher] Re-render - companies:", companies?.length || 0)
    console.log("[TeamSwitcher] Active company:", activeCompany?.title || "none")
  }, [companies, activeCompany])

  // Scenario 1: No company exists - show "Create Company" button
  if (!companies || companies.length === 0) {
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

  // Scenario 2: Single company - show with dropdown (to allow creating new company)
  if (companies.length === 1) {
    return (
      <SidebarMenu>
        <SidebarMenuItem>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <SidebarMenuButton
                size="lg"
                className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
              >
                <div className="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg overflow-hidden">
                  {activeCompany?.logo ? (
                    <img src={activeCompany.logo} alt={activeCompany.title} className="size-8 object-cover" />
                  ) : (
                    <span className="text-sm font-semibold">{activeCompany?.title.charAt(0)}</span>
                  )}
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium">{activeCompany?.title}</span>
                  <span className="truncate text-xs text-muted-foreground capitalize">{activeCompany?.type || 'Company'}</span>
                </div>
                <ChevronsUpDown className="ml-auto size-4" />
              </SidebarMenuButton>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
              align="start"
              side={isMobile ? "bottom" : "right"}
              sideOffset={4}
            >
              <DropdownMenuLabel className="text-muted-foreground text-xs">
                Current Company
              </DropdownMenuLabel>
              <DropdownMenuItem
                disabled
                className="gap-2 p-2"
              >
                <div className="flex size-6 items-center justify-center rounded-md overflow-hidden bg-sidebar-primary/10">
                  {activeCompany?.logo ? (
                    <img src={activeCompany.logo} alt={activeCompany.title} className="size-6 object-cover" />
                  ) : (
                    <span className="text-xs font-semibold">{activeCompany?.title.charAt(0)}</span>
                  )}
                </div>
                <span className="flex-1">{activeCompany?.title}</span>
                <span className="text-xs text-muted-foreground">✓</span>
              </DropdownMenuItem>
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
        </SidebarMenuItem>
      </SidebarMenu>
    )
  }

  // Scenario 3: Multiple companies - show with dropdown and search
  if (!activeCompany) {
    return null
  }

  // Limit displayed companies to 5 when not searching
  const MAX_DISPLAY_COMPANIES = 5
  const displayedCompanies = searchTerm.trim()
    ? filteredCompanies
    : filteredCompanies.slice(0, MAX_DISPLAY_COMPANIES)

  const hasMoreCompanies = !searchTerm.trim() && companies.length > MAX_DISPLAY_COMPANIES

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
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
                <span className="truncate text-xs text-muted-foreground capitalize">{activeCompany.type || 'Company'}</span>
              </div>
              <ChevronsUpDown className="ml-auto size-4" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
            align="start"
            side={isMobile ? "bottom" : "right"}
            sideOffset={4}
          >
            {/* Search input - always show for multiple companies */}
            <div className="p-2">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 size-4 text-muted-foreground" />
                <Input
                  placeholder="Search companies..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="h-9 pl-8"
                  autoFocus
                />
              </div>
            </div>
            <DropdownMenuSeparator />

            <DropdownMenuLabel className="text-muted-foreground text-xs">
              {searchTerm.trim() ? `Found ${filteredCompanies.length}` : `Companies (${companies.length})`}
            </DropdownMenuLabel>

            {displayedCompanies.length > 0 ? (
              <>
                {displayedCompanies.map((company, index) => (
                  <DropdownMenuItem
                    key={company._id}
                    onClick={() => handleCompanyChange(company)}
                    className="gap-2 p-2"
                    disabled={company._id === activeCompany._id}
                  >
                    <div className="flex size-6 items-center justify-center rounded-md overflow-hidden bg-sidebar-primary/10">
                      {company.logo ? (
                        <img src={company.logo} alt={company.title} className="size-6 object-cover" />
                      ) : (
                        <span className="text-xs font-semibold">{company.title.charAt(0)}</span>
                      )}
                    </div>
                    <span className="flex-1">{company.title}</span>
                    {company._id === activeCompany._id && (
                      <span className="text-xs text-muted-foreground">✓</span>
                    )}
                    {index < 9 && <DropdownMenuShortcut>⌘{index + 1}</DropdownMenuShortcut>}
                  </DropdownMenuItem>
                ))}
                {hasMoreCompanies && (
                  <DropdownMenuItem disabled className="text-center text-xs text-muted-foreground py-1">
                    +{companies.length - MAX_DISPLAY_COMPANIES} more companies (use search)
                  </DropdownMenuItem>
                )}
              </>
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
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
