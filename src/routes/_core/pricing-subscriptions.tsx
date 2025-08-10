import { QDataTable } from '@/components/QDataTable'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { client, handleApiResponse } from '@/lib/rpc'
import { useQuery } from '@tanstack/react-query'
import { createFileRoute, Link } from '@tanstack/react-router'
import type { ColumnDef } from '@tanstack/react-table'
import { format } from 'date-fns'

interface TenantSubscription {
  id: string
  tenantId: string
  planId: string
  status: string
  userCount: number
  pricePerUser: number
  totalMonthlyPrice: number
  billingCycle: string
  trialEndsAt: Date | null
  nextBillingDate: Date | null
  createdAt: Date
  planName?: string
}

// Column definitions for Subscriptions table - moved outside component for stability
const subscriptionsColumns: ColumnDef<TenantSubscription>[] = [
  {
    accessorKey: 'tenantId',
    header: 'Tenant ID',
    cell: ({ row }) => (
      <code className="font-mono text-sm">{row.original.tenantId.slice(0, 8)}...</code>
    ),
  },
  {
    accessorKey: 'planName',
    header: 'Plan',
  },
  {
    accessorKey: 'status',
    header: 'Status',
    cell: ({ row }) => {
      const variant =
        row.original.status === 'active'
          ? 'default'
          : row.original.status === 'trial'
            ? 'secondary'
            : row.original.status === 'cancelled'
              ? 'destructive'
              : 'outline'
      return <Badge variant={variant}>{row.original.status}</Badge>
    },
  },
  {
    accessorKey: 'userCount',
    header: 'Users',
  },
  {
    accessorKey: 'pricePerUser',
    header: 'Price/User',
    cell: ({ row }) => `$${row.original.pricePerUser}`,
  },
  {
    accessorKey: 'totalMonthlyPrice',
    header: 'Total/Month',
    cell: ({ row }) => `$${row.original.totalMonthlyPrice}`,
  },
  {
    accessorKey: 'billingCycle',
    header: 'Billing',
    cell: ({ row }) => <span className="capitalize">{row.original.billingCycle}</span>,
  },
  {
    accessorKey: 'trialEndsAt',
    header: 'Trial Ends',
    cell: ({ row }) => {
      return row.original.trialEndsAt ? format(new Date(row.original.trialEndsAt), 'MMM dd, yyyy') : '-'
    },
  },
  {
    accessorKey: 'nextBillingDate',
    header: 'Next Billing',
    cell: ({ row }) => {
      return row.original.nextBillingDate ? format(new Date(row.original.nextBillingDate), 'MMM dd, yyyy') : '-'
    },
  },
]

export const Route = createFileRoute('/_core/pricing-subscriptions')({
  component: RouteComponent,
})

function RouteComponent() {
  // Fetch subscriptions with React Query
  const { data: subscriptionsData } = useQuery({
    queryKey: ['pricing-subscriptions'],
    queryFn: async () => {
      const response = await client.pricing.subscriptions.$get()
      const result = await handleApiResponse(response)
      if (!result.success) throw new Error(result.error || 'Failed to fetch subscriptions')
      return (result.data as any)?.subscriptions || []
    },
  })

  const subscriptions = (subscriptionsData as TenantSubscription[]) || []

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Tenant Subscriptions</h1>
          <p className="text-gray-600 dark:text-gray-400">Monitor tenant subscription status and billing</p>
        </div>
        <div className="flex items-center space-x-2">
          <Button asChild variant="outline">
            <Link to="/pricing-admin">Plans</Link>
          </Button>
          <Button asChild variant="outline">
            <Link to="/pricing-discounts">Discounts</Link>
          </Button>
        </div>
      </div>

      <QDataTable
        title="Tenant Subscriptions"
        columns={subscriptionsColumns}
        data={subscriptions}
      />
    </div>
  )
}