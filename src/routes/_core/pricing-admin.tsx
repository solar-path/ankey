import { createFileRoute } from '@tanstack/react-router'
import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { format } from 'date-fns'

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
  const [plans, setPlans] = useState<PricingPlan[]>([])
  const [discounts, setDiscounts] = useState<PricingDiscount[]>([])
  const [subscriptions, setSubscriptions] = useState<TenantSubscription[]>([])
  const [editingPlan, setEditingPlan] = useState<Partial<PricingPlan> | null>(null)
  const [editingDiscount, setEditingDiscount] = useState<Partial<PricingDiscount> | null>(null)
  const [isSheetOpen, setIsSheetOpen] = useState(false)
  const [discountSheetOpen, setDiscountSheetOpen] = useState(false)

  useEffect(() => {
    fetchPlans()
    fetchSubscriptions()
  }, [])

  const fetchPlans = async () => {
    try {
      const response = await fetch('/api/core/pricing/plans')
      const data = await response.json()
      setPlans(data.plans || [])
    } catch (error) {
      console.error('Error fetching plans:', error)
    }
  }

  const fetchDiscounts = async (planId?: string) => {
    try {
      const url = planId
        ? `/api/core/pricing/plans/${planId}/discounts`
        : '/api/core/pricing/discounts'
      const response = await fetch(url)
      const data = await response.json()
      setDiscounts(data.discounts || [])
    } catch (error) {
      console.error('Error fetching discounts:', error)
    }
  }

  const fetchSubscriptions = async () => {
    try {
      const response = await fetch('/api/core/pricing/subscriptions')
      const data = await response.json()
      setSubscriptions(data.subscriptions || [])
    } catch (error) {
      console.error('Error fetching subscriptions:', error)
    }
  }

  const savePlan = async () => {
    if (!editingPlan) return

    try {
      const url = editingPlan.id
        ? `/api/core/pricing/plans/${editingPlan.id}`
        : '/api/core/pricing/plans'

      const method = editingPlan.id ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...editingPlan,
          features:
            typeof editingPlan.features === 'string'
              ? editingPlan.features
              : JSON.stringify(editingPlan.features || []),
        }),
      })

      if (response.ok) {
        fetchPlans()
        setEditingPlan(null)
        setIsSheetOpen(false)
      }
    } catch (error) {
      console.error('Error saving plan:', error)
    }
  }

  const deletePlan = async (planId: string) => {
    try {
      await fetch(`/api/core/pricing/plans/${planId}`, {
        method: 'DELETE',
      })
      fetchPlans()
    } catch (error) {
      console.error('Error deleting plan:', error)
    }
  }

  const saveDiscount = async () => {
    if (!editingDiscount) return

    try {
      const url = editingDiscount.id
        ? `/api/core/pricing/discounts/${editingDiscount.id}`
        : '/api/core/pricing/discounts'

      const method = editingDiscount.id ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingDiscount),
      })

      if (response.ok) {
        fetchDiscounts()
        setEditingDiscount(null)
        setDiscountSheetOpen(false)
      }
    } catch (error) {
      console.error('Error saving discount:', error)
    }
  }

  const deleteDiscount = async (discountId: string) => {
    try {
      await fetch(`/api/core/pricing/discounts/${discountId}`, {
        method: 'DELETE',
      })
      fetchDiscounts()
    } catch (error) {
      console.error('Error deleting discount:', error)
    }
  }

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
            onClick={() => {
              setActiveTab(tab)
              if (tab === 'discounts') fetchDiscounts()
            }}
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
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Pricing Plans</h2>
            <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
              <SheetTrigger asChild>
                <Button
                  onClick={() => {
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
                  }}
                >
                  Add Plan
                </Button>
              </SheetTrigger>
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
                    <Label htmlFor="minUsers" className="text-right">
                      Min Users
                    </Label>
                    <Input
                      id="minUsers"
                      type="number"
                      className="col-span-3"
                      value={editingPlan?.minUsers || ''}
                      onChange={e =>
                        setEditingPlan(prev =>
                          prev ? { ...prev, minUsers: parseInt(e.target.value) || null } : null
                        )
                      }
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="maxUsers" className="text-right">
                      Max Users
                    </Label>
                    <Input
                      id="maxUsers"
                      type="number"
                      className="col-span-3"
                      value={editingPlan?.maxUsers || ''}
                      onChange={e =>
                        setEditingPlan(prev =>
                          prev ? { ...prev, maxUsers: parseInt(e.target.value) || null } : null
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
                        setEditingPlan(prev =>
                          prev ? { ...prev, features: e.target.value } : null
                        )
                      }
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="trialDays" className="text-right">
                      Trial Days
                    </Label>
                    <Input
                      id="trialDays"
                      type="number"
                      className="col-span-3"
                      value={editingPlan?.trialDays || ''}
                      onChange={e =>
                        setEditingPlan(prev =>
                          prev ? { ...prev, trialDays: parseInt(e.target.value) || 0 } : null
                        )
                      }
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="trialMaxUsers" className="text-right">
                      Trial Max Users
                    </Label>
                    <Input
                      id="trialMaxUsers"
                      type="number"
                      className="col-span-3"
                      value={editingPlan?.trialMaxUsers || ''}
                      onChange={e =>
                        setEditingPlan(prev =>
                          prev ? { ...prev, trialMaxUsers: parseInt(e.target.value) || 5 } : null
                        )
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
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="displayOrder" className="text-right">
                      Display Order
                    </Label>
                    <Input
                      id="displayOrder"
                      type="number"
                      className="col-span-3"
                      value={editingPlan?.displayOrder || ''}
                      onChange={e =>
                        setEditingPlan(prev =>
                          prev ? { ...prev, displayOrder: parseInt(e.target.value) || 0 } : null
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

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Price/User/Month</TableHead>
                  <TableHead>User Limits</TableHead>
                  <TableHead>Trial</TableHead>
                  <TableHead>Badge</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {plans.map(plan => (
                  <TableRow key={plan.id}>
                    <TableCell className="font-medium">
                      <div>
                        <div>{plan.name}</div>
                        <div className="text-sm text-gray-500">{plan.description}</div>
                      </div>
                    </TableCell>
                    <TableCell>${plan.pricePerUserPerMonth}</TableCell>
                    <TableCell>
                      {plan.minUsers || 1} - {plan.maxUsers || '∞'}
                    </TableCell>
                    <TableCell>
                      {plan.trialDays || 0} days ({plan.trialMaxUsers || 0} users)
                    </TableCell>
                    <TableCell>
                      {plan.badge && (
                        <span className="inline-flex items-center rounded-full bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-700/10">
                          {plan.badge}
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ring-1 ring-inset ${
                          plan.isActive
                            ? 'bg-green-50 text-green-700 ring-green-600/20'
                            : 'bg-gray-50 text-gray-600 ring-gray-500/10'
                        }`}
                      >
                        {plan.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="outline" size="sm">
                            Actions
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                          <DropdownMenuItem
                            onClick={() => {
                              setEditingPlan(plan)
                              setIsSheetOpen(true)
                            }}
                          >
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => {
                              fetchDiscounts(plan.id)
                              setActiveTab('discounts')
                            }}
                          >
                            Manage Discounts
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => deletePlan(plan.id)}
                            className="text-red-600"
                          >
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}

      {/* Discounts Tab */}
      {activeTab === 'discounts' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Pricing Discounts</h2>
            <Sheet open={discountSheetOpen} onOpenChange={setDiscountSheetOpen}>
              <SheetTrigger asChild>
                <Button
                  onClick={() => {
                    setEditingDiscount({
                      name: '',
                      discountPercent: 0,
                      startDate: new Date(),
                      endDate: new Date(),
                      isActive: true,
                      planId: plans[0]?.id || '',
                    })
                  }}
                >
                  Add Discount
                </Button>
              </SheetTrigger>
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
                        setEditingDiscount(prev =>
                          prev ? { ...prev, name: e.target.value } : null
                        )
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

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Discount</TableHead>
                  <TableHead>Period</TableHead>
                  <TableHead>Promo Code</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {discounts.map(discount => (
                  <TableRow key={discount.id}>
                    <TableCell className="font-medium">{discount.name}</TableCell>
                    <TableCell>{discount.discountPercent}%</TableCell>
                    <TableCell>
                      {format(new Date(discount.startDate), 'MMM dd, yyyy')} -{' '}
                      {format(new Date(discount.endDate), 'MMM dd, yyyy')}
                    </TableCell>
                    <TableCell>
                      {discount.promoCode && (
                        <span className="font-mono bg-gray-100 px-2 py-1 rounded text-sm">
                          {discount.promoCode}
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ring-1 ring-inset ${
                          discount.isActive
                            ? 'bg-green-50 text-green-700 ring-green-600/20'
                            : 'bg-gray-50 text-gray-600 ring-gray-500/10'
                        }`}
                      >
                        {discount.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="outline" size="sm">
                            Actions
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                          <DropdownMenuItem
                            onClick={() => {
                              setEditingDiscount(discount)
                              setDiscountSheetOpen(true)
                            }}
                          >
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => deleteDiscount(discount.id)}
                            className="text-red-600"
                          >
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}

      {/* Subscriptions Tab */}
      {activeTab === 'subscriptions' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Tenant Subscriptions</h2>
            <Button onClick={fetchSubscriptions} variant="outline">
              Refresh
            </Button>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tenant ID</TableHead>
                  <TableHead>Plan</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Users</TableHead>
                  <TableHead>Price/User</TableHead>
                  <TableHead>Total/Month</TableHead>
                  <TableHead>Billing</TableHead>
                  <TableHead>Trial Ends</TableHead>
                  <TableHead>Next Billing</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {subscriptions.map(sub => (
                  <TableRow key={sub.id}>
                    <TableCell className="font-mono text-sm">
                      {sub.tenantId.slice(0, 8)}...
                    </TableCell>
                    <TableCell>{sub.planName}</TableCell>
                    <TableCell>
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ring-1 ring-inset ${
                          sub.status === 'active'
                            ? 'bg-green-50 text-green-700 ring-green-600/20'
                            : sub.status === 'trial'
                              ? 'bg-blue-50 text-blue-700 ring-blue-600/20'
                              : sub.status === 'cancelled'
                                ? 'bg-red-50 text-red-700 ring-red-600/20'
                                : 'bg-gray-50 text-gray-600 ring-gray-500/10'
                        }`}
                      >
                        {sub.status}
                      </span>
                    </TableCell>
                    <TableCell>{sub.userCount}</TableCell>
                    <TableCell>${sub.pricePerUser}</TableCell>
                    <TableCell>${sub.totalMonthlyPrice}</TableCell>
                    <TableCell className="capitalize">{sub.billingCycle}</TableCell>
                    <TableCell>
                      {sub.trialEndsAt ? format(new Date(sub.trialEndsAt), 'MMM dd, yyyy') : '-'}
                    </TableCell>
                    <TableCell>
                      {sub.nextBillingDate
                        ? format(new Date(sub.nextBillingDate), 'MMM dd, yyyy')
                        : '-'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}
    </div>
  )
}
