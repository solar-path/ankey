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
import { client, handleApiResponse } from '@/lib/rpc'
import { useQuery } from '@tanstack/react-query'
import { createFileRoute, Link } from '@tanstack/react-router'
import type { ColumnDef } from '@tanstack/react-table'
import { format } from 'date-fns'
import { useState } from 'react'
import { toast } from 'sonner'

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

// Column definitions for Discounts table - moved outside component for stability
const discountsColumns: ColumnDef<PricingDiscount>[] = [
  {
    accessorKey: 'name',
    header: 'Name',
  },
  {
    accessorKey: 'discountPercent',
    header: 'Discount',
    cell: ({ row }) => `${row.original.discountPercent}%`,
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
        <code className="font-mono bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded text-sm">{row.original.promoCode}</code>
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

export const Route = createFileRoute('/_core/pricing-discounts')({
  component: RouteComponent,
})

function RouteComponent() {
  const [editingDiscount, setEditingDiscount] = useState<Partial<PricingDiscount> | null>(null)
  const [discountSheetOpen, setDiscountSheetOpen] = useState(false)

  // Fetch discounts with React Query
  const { data: discountsData, refetch: refetchDiscounts } = useQuery({
    queryKey: ['pricing-discounts'],
    queryFn: async () => {
      const response = await client.pricing.discounts.$get()
      const result = await handleApiResponse(response)
      if (!result.success) throw new Error(result.error || 'Failed to fetch discounts')
      return (result.data as any)?.discounts || []
    },
  })

  const discounts = (discountsData as PricingDiscount[]) || []

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

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Pricing Discounts</h1>
          <p className="text-gray-600 dark:text-gray-400">Manage discount codes and promotional offers</p>
        </div>
        <div className="flex items-center space-x-2">
          <Button asChild variant="outline">
            <Link to="/pricing-admin">Plans</Link>
          </Button>
          <Button asChild variant="outline">
            <Link to="/pricing-subscriptions">Subscriptions</Link>
          </Button>
        </div>
      </div>

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
            planId: '', // Will need to be selected
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
  )
}