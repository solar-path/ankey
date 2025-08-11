import { SiteHeader } from '@/components/QSideBar/site-header'
import { cn } from '@/lib/utils'
import { type BreadcrumbItem } from '@/shared'
import { createFileRoute, Link, Outlet, useLocation } from '@tanstack/react-router'
import { CreditCard, DollarSign, Package, Percent } from 'lucide-react'

export const Route = createFileRoute('/_core/pricing')({
  component: PricingLayout,
})

const pricingNavigation = [
  {
    name: 'Plans',
    href: '/pricing/plans',
    icon: Package,
    description: 'Manage pricing plans and tiers',
  },
  {
    name: 'Discounts',
    href: '/pricing/discounts',
    icon: Percent,
    description: 'Configure discount codes and promotions',
  },
  {
    name: 'Subscriptions',
    href: '/pricing/subscriptions',
    icon: CreditCard,
    description: 'View and manage active subscriptions',
  },
]

function PricingLayout() {
  const location = useLocation()
  const currentPath = location.pathname

  // Determine breadcrumbs based on current path
  const getBreadcrumbs = (): BreadcrumbItem[] => {
    const path = currentPath.split('/').filter(Boolean)
    const lastSegment = path[path.length - 1]

    const breadcrumbMap: Record<string, string> = {
      plans: 'Plans',
      discounts: 'Discounts',
      subscriptions: 'Subscriptions',
      pricing: 'Pricing',
    }

    const breadcrumbs: BreadcrumbItem[] = [{ title: 'Pricing', href: '/pricing' }]

    if (lastSegment && lastSegment !== 'pricing' && breadcrumbMap[lastSegment]) {
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
        {/* Pricing Navigation */}
        <div className="w-64 dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 p-6">
          <div className="mb-6">
            <div className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-gray-600 dark:text-gray-400" />
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                Pricing Management
              </h2>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Configure plans, discounts, and subscriptions
            </p>
          </div>
          <nav className="space-y-2">
            {pricingNavigation.map(item => {
              const isActive =
                currentPath === item.href ||
                (currentPath === '/pricing' && item.href === '/pricing/plans')

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

        {/* Pricing Content */}
        <div className="flex-1 overflow-auto p-6 bg-gray-50 dark:bg-gray-900">
          <div className="max-w-6xl mx-auto">
            <Outlet />
          </div>
        </div>
      </div>
    </div>
  )
}
