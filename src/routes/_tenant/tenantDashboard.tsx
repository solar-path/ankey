import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_tenant/tenantDashboard')({
  component: TenantDashboard,
})

function TenantDashboard() {
  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold">Tenant Dashboard</h1>
        <p className="text-muted-foreground">Welcome to your workspace dashboard</p>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-lg border bg-card p-6">
          <h3 className="font-semibold">Products</h3>
          <p className="text-sm text-muted-foreground">Manage your products and inventory</p>
        </div>

        <div className="rounded-lg border bg-card p-6">
          <h3 className="font-semibold">Orders</h3>
          <p className="text-sm text-muted-foreground">Track and manage orders</p>
        </div>

        <div className="rounded-lg border bg-card p-6">
          <h3 className="font-semibold">Analytics</h3>
          <p className="text-sm text-muted-foreground">View your performance metrics</p>
        </div>
      </div>
    </div>
  )
}
