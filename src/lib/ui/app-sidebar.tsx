import * as React from "react"
import {
  LayoutDashboard,
  Settings,
  ListTodo,
  Network,
  Shield,
  FileText,
  Users,
} from "lucide-react"
import { useLocation } from "wouter"

import { NavMain } from "@/lib/ui/nav-main"
import { NavUser } from "@/lib/ui/nav-user"
import { TeamSwitcher } from "@/lib/ui/team-switcher"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
  useSidebar,
} from "@/lib/ui/sidebar"
import { useAuth } from "@/lib/auth-context"
import { useTask } from "@/lib/task-context"
import { useCompanyOptional } from "@/lib/company-context"

interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {
  user: {
    name: string
    email: string
    avatar?: string
  }
  organization: {
    name: string
    plan?: string
  }
}

export function AppSidebar({ user, organization, ...props }: AppSidebarProps) {
  const { state } = useSidebar()
  const { user: authUser } = useAuth()
  const { taskCount } = useTask()
  const companyContext = useCompanyOptional()
  const [location] = useLocation()

  // Get companies from context
  const companies = companyContext?.companies || []
  const activeCompany = companyContext?.activeCompany || null

  // Debug logging - track sidebar re-renders
  React.useEffect(() => {
    console.log("[AppSidebar] Re-render - passing companies:", companies.length, "to TeamSwitcher")
    console.log("[AppSidebar] Active company:", activeCompany?.title || "none")
  }, [companies, activeCompany])

  // Map route to file path for debug info
  const getFilePathFromRoute = (route: string): string => {
    if (route === '/') return 'src/routes/public/home.page.tsx'
    if (route.startsWith('/auth/signin')) return 'src/routes/public/auth/signin/signIn.page.tsx'
    if (route.startsWith('/auth/signup')) return 'src/routes/public/auth/signup/signUp.page.tsx'
    if (route.startsWith('/auth/forgot-password')) return 'src/routes/public/auth/forgot-password/forgotPassword.page.tsx'
    if (route.startsWith('/auth/verify-account')) return 'src/routes/public/auth/verify-account/verifyAccount.page.tsx'
    if (route.startsWith('/learn')) return 'src/routes/public/learn.page.tsx'
    if (route.startsWith('/contact')) return 'src/routes/public/contactUs.page.tsx'
    if (route.startsWith('/offers')) return 'src/routes/public/offers.page.tsx'
    if (route.startsWith('/public/job-offer/')) return 'src/routes/public/jobOfferAccept.page.tsx'
    if (route.startsWith('/dashboard')) return 'src/routes/private/dashboard/company.dashboard.page.tsx'
    if (route.startsWith('/account')) return 'src/routes/private/account/account.page.tsx'
    if (route.startsWith('/task/') && route.split('/').length === 3) return 'src/routes/private/tasks/taskDetail.page.tsx'
    if (route.startsWith('/task')) return 'src/routes/private/tasks/tasks.page.tsx'
    if (route.startsWith('/settings')) return 'src/routes/private/settings/settings.page.tsx'
    if (route.startsWith('/company/')) return 'src/routes/private/company/company.page.tsx'
    if (route.startsWith('/orgchart/detail/')) return 'src/routes/private/htr/overview/orgchartDetail.page.tsx'
    if (route.match(/^\/orgchart\/[^/]+\/assignment\//)) return 'src/routes/private/htr/assignments/assignmentDetail.page.tsx'
    if (route.startsWith('/orgchart/')) return 'src/routes/private/htr/overview/orgchart.page.tsx'
    if (route.match(/^\/doa\/[^/]+\/matrix\//)) return 'src/routes/private/doa/doaDetail.page.tsx'
    if (route.startsWith('/doa/')) return 'src/routes/private/doa/doa.page.tsx'
    if (route.startsWith('/documents')) return 'src/routes/private/documents/documents.page.tsx'
    if (route.startsWith('/job-offers')) return 'src/routes/private/htr/job-offers/jobOffers.page.tsx'
    if (route.startsWith('/job-offer/')) return 'src/routes/private/htr/job-offers/jobOfferDetail.page.tsx'
    if (route.startsWith('/users/invite')) return 'src/routes/private/user-management/invite.user.page.tsx'
    if (route.startsWith('/users/')) return 'src/routes/private/user-management/invite.user.page.tsx'
    if (route.startsWith('/users')) return 'src/routes/private/user-management/users.page.tsx'
    return 'src/routes/404.page.tsx'
  }

  const currentFilePath = getFilePathFromRoute(location)

  const navMain = [
    {
      title: "Dashboard",
      url: "/dashboard",
      icon: LayoutDashboard,
      isActive: true,
    },
    {
      title: "Tasks",
      url: "/task",
      icon: ListTodo,
      badge: taskCount,
    },
    {
      title: "Human management",
      url: `/orgchart`,
      icon: Network,
    },
    {
      title: "DOA Matrix",
      url: `/doa`,
      icon: Shield,
    },
    {
      title: "Documents",
      url: "/documents",
      icon: FileText,
    },
    {
      title: "Users",
      url: "/users",
      icon: Users,
    },
    {
      title: "Settings",
      url: "/settings",
      icon: Settings,
    },
  ]

  return (
    <Sidebar collapsible="icon" {...props} className="bg-stone-50">
      <SidebarHeader>
        {/* TeamSwitcher - shows "Create Company" button if no companies */}
        {/* Key forces re-render when companies count or active company changes */}
        <TeamSwitcher
          key={`team-switcher-${companies.length}-${activeCompany?.id || 'none'}`}
          companies={companies}
        />
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={navMain} />

        {/* Debug Information */}
        {state === "expanded" && (
          <div className="p-4 mt-auto text-xs text-muted-foreground space-y-1">
            <div className="font-semibold text-foreground mb-2">Debug Info</div>
            <div className="space-y-0.5">
              <div className="font-mono truncate">
                <span className="text-muted-foreground/60">User ID:</span>{" "}
                <span className="text-foreground">{authUser?.id || "N/A"}</span>
              </div>
              <div className="font-mono truncate">
                <span className="text-muted-foreground/60">Email:</span>{" "}
                <span className="text-foreground">{authUser?.email || "N/A"}</span>
              </div>
              <div className="font-mono truncate">
                <span className="text-muted-foreground/60">Name:</span>{" "}
                <span className="text-foreground">{authUser?.fullname || "N/A"}</span>
              </div>
              <div className="font-mono truncate">
                <span className="text-muted-foreground/60">Company:</span>{" "}
                <span className="text-foreground">{activeCompany?.title || "None"}</span>
              </div>
              <div className="font-mono truncate">
                <span className="text-muted-foreground/60">Company ID:</span>{" "}
                <span className="text-foreground">{activeCompany?.id || "None"}</span>
              </div>
              <div className="font-mono truncate">
                <span className="text-muted-foreground/60">Page:</span>{" "}
                <span className="text-foreground">{currentFilePath.split('/').pop()}</span>
              </div>
              <div className="font-mono truncate">
                <span className="text-muted-foreground/60">Route:</span>{" "}
                <span className="text-foreground">{location}</span>
              </div>
            </div>
          </div>
        )}
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
