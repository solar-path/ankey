
import { createFileRoute } from '@tanstack/react-router'
export const Route = createFileRoute('/_core/pricing-discounts')({
  component: RouteComponent,
})

function RouteComponent() {

  return (
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Pricing Discounts</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Manage discount codes and promotional offers
          </p>
        </div>
  )
}
