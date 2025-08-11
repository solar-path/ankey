import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Input } from '@/components/ui/input'
import { createFileRoute } from '@tanstack/react-router'
import { Search, Filter, Download, MoreHorizontal, User, Calendar, CreditCard, DollarSign } from 'lucide-react'
import { useState } from 'react'

export const Route = createFileRoute('/_core/pricing/subscriptions')({
  component: PricingSubscriptions,
})

function PricingSubscriptions() {
  const [searchTerm, setSearchTerm] = useState('')
  
  // Sample data - replace with actual API calls
  const subscriptions = [
    {
      id: 1,
      customer: 'Acme Corporation',
      email: 'billing@acme.com',
      plan: 'Enterprise',
      status: 'active',
      amount: 299,
      billing: 'monthly',
      startDate: '2024-01-15',
      nextBilling: '2024-12-15',
      users: 150,
    },
    {
      id: 2,
      customer: 'TechStart Inc',
      email: 'admin@techstart.io',
      plan: 'Professional',
      status: 'active',
      amount: 99,
      billing: 'monthly',
      startDate: '2024-03-20',
      nextBilling: '2024-12-20',
      users: 35,
    },
    {
      id: 3,
      customer: 'Small Business Co',
      email: 'owner@smallbiz.com',
      plan: 'Starter',
      status: 'trialing',
      amount: 29,
      billing: 'monthly',
      startDate: '2024-11-01',
      nextBilling: '2024-12-01',
      users: 8,
    },
    {
      id: 4,
      customer: 'Global Enterprises',
      email: 'finance@global.com',
      plan: 'Enterprise',
      status: 'past_due',
      amount: 299,
      billing: 'annual',
      startDate: '2023-06-01',
      nextBilling: '2024-06-01',
      users: 500,
    },
    {
      id: 5,
      customer: 'Startup Labs',
      email: 'team@startuplabs.co',
      plan: 'Professional',
      status: 'canceled',
      amount: 99,
      billing: 'monthly',
      startDate: '2024-02-10',
      nextBilling: '-',
      users: 20,
    },
  ]

  const filteredSubscriptions = subscriptions.filter(subscription =>
    subscription.customer.toLowerCase().includes(searchTerm.toLowerCase()) ||
    subscription.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    subscription.plan.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      active: 'default',
      trialing: 'secondary',
      past_due: 'destructive',
      canceled: 'outline',
    }
    return (
      <Badge variant={variants[status] || 'default'}>
        {status.replace('_', ' ')}
      </Badge>
    )
  }

  // Calculate summary stats
  const stats = {
    totalSubscriptions: subscriptions.filter(s => s.status === 'active').length,
    totalRevenue: subscriptions
      .filter(s => s.status === 'active')
      .reduce((sum, s) => sum + s.amount, 0),
    totalUsers: subscriptions
      .filter(s => s.status === 'active')
      .reduce((sum, s) => sum + s.users, 0),
    trialAccounts: subscriptions.filter(s => s.status === 'trialing').length,
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-gray-100">Subscriptions</h2>
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
            <p className="text-xs text-muted-foreground">
              +2 from last month
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${stats.totalRevenue.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              +12% from last month
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <User className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalUsers}</div>
            <p className="text-xs text-muted-foreground">
              Across all subscriptions
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Trial Accounts</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.trialAccounts}</div>
            <p className="text-xs text-muted-foreground">
              Converting this month
            </p>
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
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-[300px]"
            />
          </div>
          <Button variant="outline" size="icon">
            <Filter className="h-4 w-4" />
          </Button>
        </div>
        <Button variant="outline">
          <Download className="mr-2 h-4 w-4" />
          Export
        </Button>
      </div>

      {/* Subscriptions Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Customer</TableHead>
                <TableHead>Plan</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Users</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Next Billing</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredSubscriptions.map((subscription) => (
                <TableRow key={subscription.id}>
                  <TableCell>
                    <div>
                      <p className="font-medium">{subscription.customer}</p>
                      <p className="text-sm text-muted-foreground">{subscription.email}</p>
                    </div>
                  </TableCell>
                  <TableCell>{subscription.plan}</TableCell>
                  <TableCell>{getStatusBadge(subscription.status)}</TableCell>
                  <TableCell>{subscription.users}</TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium">${subscription.amount}</p>
                      <p className="text-sm text-muted-foreground">/{subscription.billing}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    {subscription.nextBilling !== '-' 
                      ? new Date(subscription.nextBilling).toLocaleDateString()
                      : '-'
                    }
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}