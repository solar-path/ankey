import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
import { Separator } from '@/components/ui/separator'
import { SidebarTrigger } from '@/components/ui/sidebar'
import { type BreadcrumbItem as BreadcrumbItemType } from '@/shared'
import { Link } from '@tanstack/react-router'

interface SiteHeaderProps {
  breadcrumbs?: BreadcrumbItemType[]
}

export function SiteHeader({ breadcrumbs = [] }: SiteHeaderProps) {
  // Determine the root breadcrumb based on the current context
  const isCore = window.location.pathname.includes('/account') || window.location.pathname.includes('/dashboard') || window.location.pathname.includes('/pricing')
  const rootBreadcrumb: BreadcrumbItemType = isCore
    ? { title: 'Core', href: '/dashboard' }
    : { title: 'Workspace', href: '/' } // This will be replaced with actual workspace title when available

  const allBreadcrumbs = [rootBreadcrumb, ...breadcrumbs]

  return (
    <header className="flex h-(--header-height) shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height) p-2">
      <div className="flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mx-2 data-[orientation=vertical]:h-4" />

        {/* Dynamic Breadcrumbs */}
        <Breadcrumb>
          <BreadcrumbList>
            {allBreadcrumbs.map((item, index) => (
              <div key={item.href} className="flex items-center gap-1.5">
                <BreadcrumbItem>
                  {index === allBreadcrumbs.length - 1 ? (
                    <BreadcrumbPage>{item.title}</BreadcrumbPage>
                  ) : (
                    <BreadcrumbLink asChild>
                      <Link to={item.href} className="hover:text-foreground transition-colors">
                        {item.title}
                      </Link>
                    </BreadcrumbLink>
                  )}
                </BreadcrumbItem>
                {index < allBreadcrumbs.length - 1 && <BreadcrumbSeparator />}
              </div>
            ))}
          </BreadcrumbList>
        </Breadcrumb>

        <div className="ml-auto flex items-center gap-2">
          {/* Additional header actions can be added here */}
        </div>
      </div>
    </header>
  )
}
