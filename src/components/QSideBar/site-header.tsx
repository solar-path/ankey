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
import { Link, useRouterState } from '@tanstack/react-router'

export function SiteHeader() {
  const router = useRouterState()
  const pathname = router.location.pathname

  // Generate breadcrumb items based on current path
  const generateBreadcrumbs = () => {
    const segments = pathname.split('/').filter(Boolean)
    const breadcrumbs = [{ name: 'Dashboard', href: '/dashboard' }]

    let currentPath = ''
    segments.forEach((segment, index) => {
      currentPath += `/${segment}`

      // Skip the first segment if it's just the route prefix
      if (segment === '_core' || segment === '_tenant' || segment === '_public') {
        return
      }

      // Format segment name
      let name = segment
        .split('-')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ')

      // Special cases for better naming
      if (segment === 'pricing-admin') name = 'Pricing Plans'
      if (segment === 'pricing-discounts') name = 'Pricing Discounts'
      if (segment === 'pricing-subscriptions') name = 'Subscriptions'
      if (segment === 'settings') name = 'Settings'
      if (segment === 'profile') name = 'Profile'
      if (segment === 'personal') name = 'Personal'
      if (segment === 'contacts') name = 'Contacts'
      if (segment === 'appearance') name = 'Appearance'
      if (segment === 'password') name = 'Password'
      if (segment === 'roles') name = 'Roles'

      breadcrumbs.push({
        name,
        href: currentPath,
      })
    })

    return breadcrumbs
  }

  const breadcrumbs = generateBreadcrumbs()

  return (
    <header className="flex h-(--header-height) shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height)">
      <div className="flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mx-2 data-[orientation=vertical]:h-4" />

        {/* Dynamic Breadcrumbs */}
        <Breadcrumb>
          <BreadcrumbList>
            {breadcrumbs.map((item, index) => (
              <div key={item.href} className="flex items-center gap-1.5">
                <BreadcrumbItem>
                  {index === breadcrumbs.length - 1 ? (
                    <BreadcrumbPage>{item.name}</BreadcrumbPage>
                  ) : (
                    <BreadcrumbLink asChild>
                      <Link to={item.href} className="hover:text-foreground transition-colors">
                        {item.name}
                      </Link>
                    </BreadcrumbLink>
                  )}
                </BreadcrumbItem>
                {index < breadcrumbs.length - 1 && <BreadcrumbSeparator />}
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
