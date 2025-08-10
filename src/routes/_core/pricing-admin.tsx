import { QDataTable } from '@/components/QDataTable'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Textarea } from '@/components/ui/textarea'
import { client, handleApiResponse } from '@/lib/rpc'
import { useQuery } from '@tanstack/react-query'
import { createFileRoute, Link } from '@tanstack/react-router'
import type { ColumnDef } from '@tanstack/react-table'
import { useState } from 'react'
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


// Column definitions for Plans table - moved outside component for stability
const plansColumns: ColumnDef<PricingPlan>[] = [
  {
    accessorKey: 'name',
    header: 'Name',
    cell: ({ row }) => (
      <div>
        <div className="font-medium">{row.original.name}</div>
        <div className="text-sm text-muted-foreground dark:text-gray-400">{row.original.description}</div>
      </div>
    ),
  },
  {
    accessorKey: 'pricePerUserPerMonth',
    header: 'Price/User/Month',
    cell: ({ row }) => `$${row.original.pricePerUserPerMonth}`,
  },
  {
    id: 'userLimits',
    header: 'User Limits',
    cell: ({ row }) => `${row.original.minUsers || 1} - ${row.original.maxUsers || '∞'}`,
  },
  {
    id: 'trial',
    header: 'Trial',
    cell: ({ row }) => `${row.original.trialDays || 0} days (${row.original.trialMaxUsers || 0} users)`,
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


export const Route = createFileRoute('/_core/pricing-admin')({
  component: RouteComponent,
})

function RouteComponent() {
  const [editingPlan, setEditingPlan] = useState<Partial<PricingPlan> | null>(null)
  const [isSheetOpen, setIsSheetOpen] = useState(false)

  // Fetch plans with React Query
  const { data: plansData, refetch: refetchPlans } = useQuery({
    queryKey: ['pricing-plans'],
    queryFn: async () => {
      const response = await client.pricing.plans.$get()
      const result = await handleApiResponse(response)
      if (!result.success) throw new Error(result.error || 'Failed to fetch plans')
      return (result.data as any)?.plans || []
    },
  })

  const plans = (plansData as PricingPlan[]) || []

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


  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Pricing Plans</h1>
          <p className="text-gray-600 dark:text-gray-400">Manage your pricing plans and subscription options</p>
        </div>
        <div className="flex items-center space-x-2">
          <Button asChild variant="outline">
            <Link to="/pricing-discounts">Discounts</Link>
          </Button>
          <Button asChild variant="outline">
            <Link to="/pricing-subscriptions">Subscriptions</Link>
          </Button>
        </div>
      </div>

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
  )
}
