import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { client } from '@/lib/rpc'
import { createFileRoute } from '@tanstack/react-router'
import {
  Calendar,
  CreditCard,
  Download,
  Filter,
  MoreHorizontal,
  Search,
  User,
  DollarSign,
  RefreshCw,
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
  const [searchTerm, setSearchTerm] = useState('')
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([])
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)

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
      setSyncing(true)
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
    } finally {
      setSyncing(false)
    }
  }

  const filteredSubscriptions = subscriptions.filter(
    subscription =>
      subscription.tenantName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      subscription.tenantSubdomain?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      subscription.planName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      subscription.status.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const getStatusBadge = (status: string) => {
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

      {/* Filters and Search */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input
              type="text"
              placeholder="Search subscriptions..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="pl-10 w-[300px]"
            />
          </div>
          <Button variant="outline" size="icon">
            <Filter className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            onClick={syncSubscriptions}
            disabled={syncing}
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${syncing ? 'animate-spin' : ''}`} />
            {syncing ? 'Syncing...' : 'Sync Data'}
          </Button>
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

      {/* Subscriptions Table */}
      {filteredSubscriptions.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <p className="text-muted-foreground">
              {searchTerm
                ? 'No subscriptions found matching your search'
                : 'No subscriptions found'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tenant</TableHead>
                  <TableHead>Plan</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Users</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Next Billing</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSubscriptions.map(subscription => (
                  <TableRow key={subscription.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{subscription.tenantName || 'Unknown Tenant'}</p>
                        <p className="text-sm text-muted-foreground">
                          {subscription.tenantSubdomain ? `${subscription.tenantSubdomain}.ankey.app` : 'No subdomain'} • Created {new Date(subscription.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>{subscription.planName || 'Unknown Plan'}</TableCell>
                    <TableCell>{getStatusBadge(subscription.status)}</TableCell>
                    <TableCell>{subscription.userCount}</TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">${subscription.totalMonthlyPrice}</p>
                        <p className="text-sm text-muted-foreground">
                          ${subscription.pricePerUser}/user
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      {subscription.status === 'trial' && subscription.trialEndsAt
                        ? (
                          <div>
                            <p className="text-sm">Trial ends</p>
                            <p className="font-medium">{new Date(subscription.trialEndsAt).toLocaleDateString()}</p>
                          </div>
                        )
                        : subscription.nextBillingDate
                          ? (
                            <div>
                              <p className="text-sm">Next billing</p>
                              <p className="font-medium">{new Date(subscription.nextBillingDate).toLocaleDateString()}</p>
                            </div>
                          )
                          : '-'}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm">
                          View Details
                        </Button>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
