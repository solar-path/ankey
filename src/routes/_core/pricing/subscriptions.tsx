import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { QDataTable } from '@/components/QDataTable'
import { client } from '@/lib/rpc'
import { createFileRoute } from '@tanstack/react-router'
import { type ColumnDef } from '@tanstack/react-table'
import {
  Calendar,
  CreditCard,
  User,
  DollarSign,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'

export const Route = createFileRoute('/_core/pricing/subscriptions')({
  component: PricingSubscriptions,
})

interface Subscription {
  id: string
  tenantId: string
  tenantName: string | null
  tenantSubdomain: string | null
  planId: string
  planName: string | null
  status: string
  userCount: number
  pricePerUser: number
  totalMonthlyPrice: number
  billingCycle: string
  trialEndsAt: string | null
  nextBillingDate: string | null
  createdAt: string
}

function PricingSubscriptions() {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([])
  const [loading, setLoading] = useState(true)

  // Define columns for QDataTable
  const columns: ColumnDef<Subscription>[] = [
    {
      accessorKey: 'tenantName',
      header: 'Tenant',
      cell: ({ row }) => (
        <div>
          <p className="font-medium">{row.original.tenantName || 'Unknown Tenant'}</p>
          <p className="text-sm text-muted-foreground">
            {row.original.tenantSubdomain ? (
              <a 
                href={`http://${row.original.tenantSubdomain}.localhost:3000`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 dark:text-blue-400 hover:underline"
              >
                {row.original.tenantSubdomain}.localhost:3000
              </a>
            ) : (
              'No subdomain'
            )} • Created {new Date(row.original.createdAt).toLocaleDateString()}
          </p>
        </div>
      ),
    },
    {
      accessorKey: 'planName',
      header: 'Plan',
      cell: ({ row }) => row.original.planName || 'Unknown Plan',
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => {
        const status = row.original.status
        const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
          active: 'default',
          trialing: 'secondary',
          trial: 'secondary',
          past_due: 'destructive',
          pastdue: 'destructive',
          cancelled: 'outline',
          canceled: 'outline',
          inactive: 'outline',
        }
        return <Badge variant={variants[status] || 'outline'}>{status.replace('_', ' ')}</Badge>
      },
    },
    {
      accessorKey: 'userCount',
      header: 'Users',
    },
    {
      accessorKey: 'totalMonthlyPrice',
      header: 'Amount',
      cell: ({ row }) => (
        <div>
          <p className="font-medium">${row.original.totalMonthlyPrice}</p>
          <p className="text-sm text-muted-foreground">
            ${row.original.pricePerUser}/user
          </p>
        </div>
      ),
    },
    {
      accessorKey: 'nextBillingDate',
      header: 'Next Billing',
      cell: ({ row }) => {
        const subscription = row.original
        if (subscription.status === 'trial' && subscription.trialEndsAt) {
          return (
            <div>
              <p className="text-sm">Trial ends</p>
              <p className="font-medium">{new Date(subscription.trialEndsAt).toLocaleDateString()}</p>
            </div>
          )
        } else if (subscription.nextBillingDate) {
          return (
            <div>
              <p className="text-sm">Next billing</p>
              <p className="font-medium">{new Date(subscription.nextBillingDate).toLocaleDateString()}</p>
            </div>
          )
        }
        return '-'
      },
    },
  ]

  useEffect(() => {
    fetchSubscriptions()
  }, [])

  const fetchSubscriptions = async () => {
    try {
      setLoading(true)
      const response = await client.pricing.subscriptions.$get()

      if (response.ok) {
        const data = await response.json()
        setSubscriptions(data.subscriptions)
      } else {
        toast.error('Failed to load subscriptions')
      }
    } catch (error) {
      console.error('Error fetching subscriptions:', error)
      toast.error('Failed to load subscriptions')
    } finally {
      setLoading(false)
    }
  }

  const syncSubscriptions = async () => {
    try {
      const response = await client.pricing.subscriptions.sync.$post()

      if (response.ok) {
        const data = await response.json()
        
        // Show detailed sync results
        const parts = []
        if (data.synced > 0) parts.push(`${data.synced} updated`)
        if (data.created > 0) parts.push(`${data.created} created`)
        if (data.errors > 0) parts.push(`${data.errors} errors`)
        
        const description = parts.length > 0 
          ? `Subscriptions: ${parts.join(', ')}`
          : 'All subscription data is up to date'
        
        toast.success('Subscription data synced successfully', {
          description
        })
        
        // Refresh the data after sync
        await fetchSubscriptions()
      } else {
        toast.error('Failed to sync subscription data')
      }
    } catch (error) {
      console.error('Error syncing subscriptions:', error)
      toast.error('Failed to sync subscription data')
    }
  }

  // Action handlers for QDataTable
  const handleEdit = (subscription: Subscription) => {
    // TODO: Implement edit functionality
    toast.info(`Edit subscription for ${subscription.tenantName}`)
  }

  const handleDelete = async (subscriptions: Subscription[]) => {
    // TODO: Implement delete functionality
    const names = subscriptions.map(s => s.tenantName || 'Unknown').join(', ')
    toast.info(`Delete subscriptions: ${names}`)
  }

  const handleExportExcel = () => {
    // TODO: Implement Excel export
    toast.info('Export to Excel functionality coming soon')
  }

  const handleExportPdf = () => {
    // TODO: Implement PDF export
    toast.info('Export to PDF functionality coming soon')
  }

  // Calculate summary stats
  const stats = {
    totalSubscriptions: subscriptions.filter(s => s.status === 'active').length,
    totalRevenue: subscriptions
      .filter(s => s.status === 'active')
      .reduce((sum, s) => sum + s.totalMonthlyPrice, 0),
    totalUsers: subscriptions
      .filter(s => s.status === 'active')
      .reduce((sum, s) => sum + s.userCount, 0),
    trialAccounts: subscriptions.filter(s => s.status === 'trial' || s.status === 'trialing')
      .length,
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-gray-100">
            Subscriptions
          </h2>
          <p className="text-muted-foreground">Monitor and manage active customer subscriptions</p>
        </div>

        {/* Stats Cards Loading */}
        <div className="grid gap-4 md:grid-cols-4">
          {[1, 2, 3, 4].map(i => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-4" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16 mb-1" />
                <Skeleton className="h-3 w-24" />
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="flex items-center justify-between">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-10 w-20" />
        </div>

        <Card>
          <CardContent className="p-0">
            <div className="space-y-4 p-6">
              {[1, 2, 3, 4, 5].map(i => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-gray-100">
          Subscriptions
        </h2>
        <p className="text-muted-foreground">Monitor and manage active customer subscriptions</p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Subscriptions</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalSubscriptions}</div>
            <p className="text-xs text-muted-foreground">Paying customers</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${stats.totalRevenue.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Recurring revenue</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <User className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalUsers}</div>
            <p className="text-xs text-muted-foreground">Across all subscriptions</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Trial Accounts</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.trialAccounts}</div>
            <p className="text-xs text-muted-foreground">In trial period</p>
          </CardContent>
        </Card>
      </div>

      {/* Subscriptions Data Table */}
      <QDataTable
        title="Subscriptions"
        columns={columns}
        data={subscriptions}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onExportExcel={handleExportExcel}
        onExportPdf={handleExportPdf}
        onSync={syncSubscriptions}
      />
    </div>
  )
}
