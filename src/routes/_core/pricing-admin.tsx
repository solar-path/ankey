import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import type { ColumnDef } from '@tanstack/react-table'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { client, handleApiResponse } from '@/lib/rpc'
import { QDataTable } from '@/components/QDataTable'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { format } from 'date-fns'
import { toast } from 'sonner'

interface PricingPlan {
  id: string
  name: string
  description: string | null
  pricePerUserPerMonth: number
  minUsers: number | null
  maxUsers: number | null
  features: string
  trialDays: number | null
  trialMaxUsers: number | null
  isActive: boolean
  displayOrder: number | null
  badge: string | null
  createdAt: Date
  updatedAt: Date
}

interface PricingDiscount {
  id: string
  planId: string
  name: string
  discountPercent: number
  startDate: Date
  endDate: Date
  isActive: boolean
  promoCode: string | null
  minMonths: number | null
  createdAt: Date
}

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

export const Route = createFileRoute('/_core/pricing-admin')({
  component: RouteComponent,
})

function RouteComponent() {
  const [activeTab, setActiveTab] = useState<'plans' | 'discounts' | 'subscriptions'>('plans')
  const [editingPlan, setEditingPlan] = useState<Partial<PricingPlan> | null>(null)
  const [editingDiscount, setEditingDiscount] = useState<Partial<PricingDiscount> | null>(null)
  const [isSheetOpen, setIsSheetOpen] = useState(false)
  const [discountSheetOpen, setDiscountSheetOpen] = useState(false)

  // Fetch plans with React Query
  const {
    data: plansData,
    refetch: refetchPlans,
  } = useQuery({
    queryKey: ['pricing-plans'],
    queryFn: async () => {
      const response = await client.pricing.plans.$get()
      const result = await handleApiResponse(response)
      if (!result.success) throw new Error(result.error || 'Failed to fetch plans')
      return result.data?.plans || []
    },
  })

  // Fetch discounts with React Query
  const {
    data: discountsData,
    refetch: refetchDiscounts,
  } = useQuery({
    queryKey: ['pricing-discounts'],
    queryFn: async () => {
      const response = await client.pricing.discounts.$get()
      const result = await handleApiResponse(response)
      if (!result.success) throw new Error(result.error || 'Failed to fetch discounts')
      return result.data?.discounts || []
    },
    enabled: activeTab === 'discounts',
  })

  // Fetch subscriptions with React Query
  const {
    data: subscriptionsData,
    refetch: refetchSubscriptions,
  } = useQuery({
    queryKey: ['pricing-subscriptions'],
    queryFn: async () => {
      const response = await client.pricing.subscriptions.$get()
      const result = await handleApiResponse(response)
      if (!result.success) throw new Error(result.error || 'Failed to fetch subscriptions')
      return result.data?.subscriptions || []
    },
    enabled: activeTab === 'subscriptions',
  })

  const plans = plansData || []
  const discounts = discountsData || []
  const subscriptions = subscriptionsData || []

  const savePlan = async () => {
    if (!editingPlan) return

    try {
      const planData = {
        ...editingPlan,
        features:
          typeof editingPlan.features === 'string'
            ? editingPlan.features
            : JSON.stringify(editingPlan.features || []),
      }

      let response
      if (editingPlan.id) {
        // Update existing plan
        response = await client.pricing.plans[':id'].$put({
          param: { id: editingPlan.id },
          json: planData,
        })
      } else {
        // Create new plan
        response = await client.pricing.plans.$post({ json: planData })
      }

      const result = await handleApiResponse(response)
      if (result.success) {
        toast.success(editingPlan.id ? 'Plan updated successfully' : 'Plan created successfully')
        refetchPlans()
        setEditingPlan(null)
        setIsSheetOpen(false)
      } else {
        toast.error(result.error || 'Failed to save plan')
      }
    } catch (error) {
      console.error('Error saving plan:', error)
      toast.error('Failed to save plan')
    }
  }

  const deletePlan = async (planId: string) => {
    try {
      const response = await client.pricing.plans[':id'].$delete({
        param: { id: planId },
      })
      const result = await handleApiResponse(response)

      if (result.success) {
        toast.success('Plan deleted successfully')
        refetchPlans()
      } else {
        toast.error(result.error || 'Failed to delete plan')
      }
    } catch (error) {
      console.error('Error deleting plan:', error)
      toast.error('Failed to delete plan')
    }
  }

  const saveDiscount = async () => {
    if (!editingDiscount) return

    try {
      let response
      if (editingDiscount.id) {
        // Update existing discount
        response = await client.pricing.discounts[':id'].$put({
          param: { id: editingDiscount.id },
          json: editingDiscount,
        })
      } else {
        // Create new discount
        response = await client.pricing.discounts.$post({ json: editingDiscount })
      }

      const result = await handleApiResponse(response)
      if (result.success) {
        toast.success(
          editingDiscount.id ? 'Discount updated successfully' : 'Discount created successfully'
        )
        refetchDiscounts()
        setEditingDiscount(null)
        setDiscountSheetOpen(false)
      } else {
        toast.error(result.error || 'Failed to save discount')
      }
    } catch (error) {
      console.error('Error saving discount:', error)
      toast.error('Failed to save discount')
    }
  }

  const deleteDiscount = async (discountId: string) => {
    try {
      const response = await client.pricing.discounts[':id'].$delete({
        param: { id: discountId },
      })
      const result = await handleApiResponse(response)

      if (result.success) {
        toast.success('Discount deleted successfully')
        refetchDiscounts()
      } else {
        toast.error(result.error || 'Failed to delete discount')
      }
    } catch (error) {
      console.error('Error deleting discount:', error)
      toast.error('Failed to delete discount')
    }
  }

  // Column definitions for Plans table
  const plansColumns: ColumnDef<PricingPlan>[] = [
    {
      accessorKey: 'name',
      header: 'Name',
      cell: ({ row }) => (
        <div>
          <div className="font-medium">{row.getValue('name')}</div>
          <div className="text-sm text-gray-500">{row.original.description}</div>
        </div>
      ),
    },
    {
      accessorKey: 'pricePerUserPerMonth',
      header: 'Price/User/Month',
      cell: ({ row }) => `$${row.getValue('pricePerUserPerMonth')}`,
    },
    {
      id: 'userLimits',
      header: 'User Limits',
      cell: ({ row }) => `${row.original.minUsers || 1} - ${row.original.maxUsers || '∞'}`,
    },
    {
      id: 'trial',
      header: 'Trial',
      cell: ({ row }) =>
        `${row.original.trialDays || 0} days (${row.original.trialMaxUsers || 0} users)`,
    },
    {
      accessorKey: 'badge',
      header: 'Badge',
      cell: ({ row }) =>
        row.original.badge ? <Badge variant="secondary">{row.original.badge}</Badge> : null,
    },
    {
      accessorKey: 'isActive',
      header: 'Status',
      cell: ({ row }) => (
        <Badge variant={row.original.isActive ? 'default' : 'secondary'}>
          {row.original.isActive ? 'Active' : 'Inactive'}
        </Badge>
      ),
    },
  ]

  // Column definitions for Discounts table
  const discountsColumns: ColumnDef<PricingDiscount>[] = [
    {
      accessorKey: 'name',
      header: 'Name',
    },
    {
      accessorKey: 'discountPercent',
      header: 'Discount',
      cell: ({ row }) => `${row.getValue('discountPercent')}%`,
    },
    {
      id: 'period',
      header: 'Period',
      cell: ({ row }) =>
        `${format(new Date(row.original.startDate), 'MMM dd, yyyy')} - ${format(new Date(row.original.endDate), 'MMM dd, yyyy')}`,
    },
    {
      accessorKey: 'promoCode',
      header: 'Promo Code',
      cell: ({ row }) =>
        row.original.promoCode ? (
          <code className="font-mono bg-gray-100 px-2 py-1 rounded text-sm">
            {row.original.promoCode}
          </code>
        ) : null,
    },
    {
      accessorKey: 'isActive',
      header: 'Status',
      cell: ({ row }) => (
        <Badge variant={row.original.isActive ? 'default' : 'secondary'}>
          {row.original.isActive ? 'Active' : 'Inactive'}
        </Badge>
      ),
    },
  ]

  // Column definitions for Subscriptions table
  const subscriptionsColumns: ColumnDef<TenantSubscription>[] = [
    {
      accessorKey: 'tenantId',
      header: 'Tenant ID',
      cell: ({ row }) => (
        <code className="font-mono text-sm">{row.getValue<string>('tenantId').slice(0, 8)}...</code>
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
        const status = row.getValue<string>('status')
        const variant =
          status === 'active'
            ? 'default'
            : status === 'trial'
              ? 'secondary'
              : status === 'cancelled'
                ? 'destructive'
                : 'outline'
        return <Badge variant={variant}>{status}</Badge>
      },
    },
    {
      accessorKey: 'userCount',
      header: 'Users',
    },
    {
      accessorKey: 'pricePerUser',
      header: 'Price/User',
      cell: ({ row }) => `$${row.getValue('pricePerUser')}`,
    },
    {
      accessorKey: 'totalMonthlyPrice',
      header: 'Total/Month',
      cell: ({ row }) => `$${row.getValue('totalMonthlyPrice')}`,
    },
    {
      accessorKey: 'billingCycle',
      header: 'Billing',
      cell: ({ row }) => <span className="capitalize">{row.getValue('billingCycle')}</span>,
    },
    {
      accessorKey: 'trialEndsAt',
      header: 'Trial Ends',
      cell: ({ row }) => {
        const date = row.getValue<Date | null>('trialEndsAt')
        return date ? format(new Date(date), 'MMM dd, yyyy') : '-'
      },
    },
    {
      accessorKey: 'nextBillingDate',
      header: 'Next Billing',
      cell: ({ row }) => {
        const date = row.getValue<Date | null>('nextBillingDate')
        return date ? format(new Date(date), 'MMM dd, yyyy') : '-'
      },
    },
  ]

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Pricing Management</h1>
      </div>

      {/* Tabs */}
      <div className="flex space-x-1 border-b">
        {(['plans', 'discounts', 'subscriptions'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 text-sm font-medium capitalize ${
              activeTab === tab
                ? 'border-b-2 border-blue-500 text-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Plans Tab */}
      {activeTab === 'plans' && (
        <div className="space-y-4">
          <QDataTable
            title="Pricing Plans"
            columns={plansColumns}
            data={plans}
            onEdit={(plan: PricingPlan) => {
              setEditingPlan(plan)
              setIsSheetOpen(true)
            }}
            onDelete={(selectedPlans: PricingPlan[]) => {
              selectedPlans.forEach(plan => deletePlan(plan.id))
            }}
            onCreate={() => {
              setEditingPlan({
                name: '',
                description: '',
                pricePerUserPerMonth: 0,
                features: '[]',
                isActive: true,
                displayOrder: 0,
                trialDays: 0,
                trialMaxUsers: 5,
              })
              setIsSheetOpen(true)
            }}
          />

          {/* Edit Plan Sheet */}
          <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
            <SheetContent className="w-[400px] sm:w-[540px]">
              <SheetHeader>
                <SheetTitle>{editingPlan?.id ? 'Edit Plan' : 'Add Plan'}</SheetTitle>
                <SheetDescription>
                  {editingPlan?.id ? 'Update pricing plan details' : 'Create a new pricing plan'}
                </SheetDescription>
              </SheetHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="name" className="text-right">
                    Name
                  </Label>
                  <Input
                    id="name"
                    className="col-span-3"
                    value={editingPlan?.name || ''}
                    onChange={e =>
                      setEditingPlan(prev => (prev ? { ...prev, name: e.target.value } : null))
                    }
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="description" className="text-right">
                    Description
                  </Label>
                  <Textarea
                    id="description"
                    className="col-span-3"
                    value={editingPlan?.description || ''}
                    onChange={e =>
                      setEditingPlan(prev =>
                        prev ? { ...prev, description: e.target.value } : null
                      )
                    }
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="price" className="text-right">
                    Price/User/Month
                  </Label>
                  <Input
                    id="price"
                    type="number"
                    className="col-span-3"
                    value={editingPlan?.pricePerUserPerMonth || ''}
                    onChange={e =>
                      setEditingPlan(prev =>
                        prev ? { ...prev, pricePerUserPerMonth: parseInt(e.target.value) } : null
                      )
                    }
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="features" className="text-right">
                    Features
                  </Label>
                  <Textarea
                    id="features"
                    placeholder="Feature 1, Feature 2, Feature 3"
                    className="col-span-3"
                    value={editingPlan?.features || ''}
                    onChange={e =>
                      setEditingPlan(prev => (prev ? { ...prev, features: e.target.value } : null))
                    }
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="badge" className="text-right">
                    Badge
                  </Label>
                  <Input
                    id="badge"
                    placeholder="Popular, Best Value, etc."
                    className="col-span-3"
                    value={editingPlan?.badge || ''}
                    onChange={e =>
                      setEditingPlan(prev =>
                        prev ? { ...prev, badge: e.target.value || null } : null
                      )
                    }
                  />
                </div>
              </div>
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setIsSheetOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={savePlan}>Save Plan</Button>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      )}

      {/* Discounts Tab */}
      {activeTab === 'discounts' && (
        <div className="space-y-4">
          <QDataTable
            title="Pricing Discounts"
            columns={discountsColumns}
            data={discounts}
            onEdit={(discount: PricingDiscount) => {
              setEditingDiscount(discount)
              setDiscountSheetOpen(true)
            }}
            onDelete={(selectedDiscounts: PricingDiscount[]) => {
              selectedDiscounts.forEach(discount => deleteDiscount(discount.id))
            }}
            onCreate={() => {
              setEditingDiscount({
                name: '',
                discountPercent: 0,
                startDate: new Date(),
                endDate: new Date(),
                isActive: true,
                planId: plans[0]?.id || '',
              })
              setDiscountSheetOpen(true)
            }}
          />

          {/* Edit Discount Sheet */}
          <Sheet open={discountSheetOpen} onOpenChange={setDiscountSheetOpen}>
            <SheetContent>
              <SheetHeader>
                <SheetTitle>{editingDiscount?.id ? 'Edit Discount' : 'Add Discount'}</SheetTitle>
                <SheetDescription>
                  {editingDiscount?.id ? 'Update discount details' : 'Create a new discount'}
                </SheetDescription>
              </SheetHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="discountName" className="text-right">
                    Name
                  </Label>
                  <Input
                    id="discountName"
                    className="col-span-3"
                    value={editingDiscount?.name || ''}
                    onChange={e =>
                      setEditingDiscount(prev => (prev ? { ...prev, name: e.target.value } : null))
                    }
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="discountPercent" className="text-right">
                    Discount %
                  </Label>
                  <Input
                    id="discountPercent"
                    type="number"
                    min="0"
                    max="100"
                    className="col-span-3"
                    value={editingDiscount?.discountPercent || ''}
                    onChange={e =>
                      setEditingDiscount(prev =>
                        prev ? { ...prev, discountPercent: parseInt(e.target.value) } : null
                      )
                    }
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="promoCode" className="text-right">
                    Promo Code
                  </Label>
                  <Input
                    id="promoCode"
                    className="col-span-3"
                    value={editingDiscount?.promoCode || ''}
                    onChange={e =>
                      setEditingDiscount(prev =>
                        prev ? { ...prev, promoCode: e.target.value || null } : null
                      )
                    }
                  />
                </div>
              </div>
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setDiscountSheetOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={saveDiscount}>Save Discount</Button>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      )}

      {/* Subscriptions Tab */}
      {activeTab === 'subscriptions' && (
        <div className="space-y-4">
          <QDataTable
            title="Tenant Subscriptions"
            columns={subscriptionsColumns}
            data={subscriptions}
            onSync={() => refetchSubscriptions()}
          />
        </div>
      )}
    </div>
  )
}
