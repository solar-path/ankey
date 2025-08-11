import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_core/pricing/pricing-subscriptions')({
  component: RouteComponent,
})

function RouteComponent() {
  // Fetch subscriptions with React Query

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Tenant Subscriptions</h1>
      <p className="text-gray-600 dark:text-gray-400">
        Monitor tenant subscription status and billing
      </p>
    </div>
  )
}
