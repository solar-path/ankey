import { useDrawer } from '@/components/QDrawer/QDrawer.store'
import { DiscountForm } from '@/components/pricing/DiscountForm'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { client } from '@/lib/rpc'
import { createFileRoute } from '@tanstack/react-router'
import { Calendar, Copy, Edit, Percent, Plus, Search, Trash2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'

export const Route = createFileRoute('/_core/pricing/discounts')({
  component: PricingDiscounts,
})

interface Discount {
  id: string
  planId: string
  name: string
  discountPercent: number
  startDate: string
  endDate: string
  promoCode?: string | null
  minMonths?: number | null
  isActive: boolean
  createdAt: string
  updatedAt: string
}

interface PricingPlan {
  id: string
  name: string
}

function PricingDiscounts() {
  const [searchTerm, setSearchTerm] = useState('')
  const [discounts, setDiscounts] = useState<Discount[]>([])
  const [plans, setPlans] = useState<PricingPlan[]>([])
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState<string | null>(null)
  const { openDrawer, closeDrawer } = useDrawer()

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)

      // Fetch discounts and plans in parallel
      const [discountsResponse, plansResponse] = await Promise.all([
        client.pricing.discounts.$get(),
        client.pricing.plans.$get(),
      ])

      if (discountsResponse.ok) {
        const discountsData = await discountsResponse.json()
        setDiscounts(discountsData.discounts)
      } else {
        toast.error('Failed to load discounts')
      }

      if (plansResponse.ok) {
        const plansData = await plansResponse.json()
        setPlans(plansData.plans)
      }
    } catch (error) {
      console.error('Error fetching data:', error)
      toast.error('Failed to load discounts')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteDiscount = async (discountId: string) => {
    try {
      setDeleting(discountId)
      const response = await client.pricing.discounts[':id'].$delete({
        param: { id: discountId },
      })

      if (response.ok) {
        toast.success('Discount deleted successfully')
        await fetchData()
      } else {
        toast.error('Failed to delete discount')
      }
    } catch (error) {
      console.error('Error deleting discount:', error)
      toast.error('Failed to delete discount')
    } finally {
      setDeleting(null)
    }
  }

  const copyToClipboard = (code: string) => {
    navigator.clipboard.writeText(code)
    toast.success('Code copied to clipboard')
  }

  const getPlanName = (planId: string) => {
    const plan = plans.find(p => p.id === planId)
    return plan?.name || 'Unknown Plan'
  }

  const getDiscountStatus = (discount: Discount) => {
    if (!discount.isActive) return 'inactive'
    const now = new Date()
    const start = new Date(discount.startDate)
    const end = new Date(discount.endDate)

    if (now < start) return 'scheduled'
    if (now > end) return 'expired'
    return 'active'
  }

  const handleCreateDiscount = () => {
    openDrawer(
      'Create New Discount',
      'Set up a promotional discount for your plans',
      <DiscountForm
        onSuccess={() => {
          closeDrawer()
          fetchData()
        }}
      />
    )
  }

  const handleEditDiscount = (discount: Discount) => {
    const initialData = {
      name: discount.name,
      planId: discount.planId,
      discountPercent: discount.discountPercent,
      startDate: discount.startDate,
      endDate: discount.endDate,
      promoCode: discount.promoCode || '',
      minMonths: discount.minMonths || undefined,
      isActive: discount.isActive,
    }

    openDrawer(
      'Edit Discount',
      'Update the discount details',
      <DiscountForm
        discountId={discount.id}
        initialData={initialData}
        onSuccess={() => {
          closeDrawer()
          fetchData()
        }}
      />
    )
  }

  const filteredDiscounts = discounts.filter(
    discount =>
      discount.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      discount.promoCode?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      getPlanName(discount.planId).toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-gray-100">
              Discount Codes
            </h2>
            <p className="text-muted-foreground">Manage promotional codes and special offers</p>
          </div>
          <Skeleton className="h-10 w-32" />
        </div>
        <Skeleton className="h-10 w-full max-w-sm" />
        <div className="grid gap-4">
          {[1, 2, 3].map(i => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-48" />
                <Skeleton className="h-4 w-64" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-20 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-gray-100">
            Discount Codes
          </h2>
          <p className="text-muted-foreground">Manage promotional codes and special offers</p>
        </div>
        <Button onClick={() => handleCreateDiscount()}>
          <Plus className="mr-2 h-4 w-4" />
          Create Discount
        </Button>
      </div>

      <div className="flex items-center space-x-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <Input
            type="text"
            placeholder="Search discount codes..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {filteredDiscounts.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <p className="text-muted-foreground mb-4">
              {searchTerm ? 'No discounts found matching your search' : 'No discount codes found'}
            </p>
            {!searchTerm && (
              <Button onClick={() => handleCreateDiscount()}>
                <Plus className="mr-2 h-4 w-4" />
                Create Your First Discount
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filteredDiscounts.map(discount => {
            const status = getDiscountStatus(discount)
            return (
              <Card key={discount.id}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <CardTitle className="text-lg">{discount.name}</CardTitle>
                        {discount.promoCode && (
                          <>
                            <code className="px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded text-sm font-mono">
                              {discount.promoCode}
                            </code>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6"
                              onClick={() => copyToClipboard(discount.promoCode!)}
                            >
                              <Copy className="h-3 w-3" />
                            </Button>
                          </>
                        )}
                        <Badge
                          variant={
                            status === 'active'
                              ? 'default'
                              : status === 'scheduled'
                                ? 'secondary'
                                : status === 'expired'
                                  ? 'outline'
                                  : 'destructive'
                          }
                        >
                          {status}
                        </Badge>
                      </div>
                      <CardDescription>
                        For {getPlanName(discount.planId)} plan
                        {discount.minMonths && ` • Min ${discount.minMonths} months commitment`}
                      </CardDescription>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="flex items-center text-lg font-semibold">
                        <Percent className="h-4 w-4 mr-1" />
                        {discount.discountPercent}%
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEditDiscount(discount)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteDiscount(discount.id)}
                          disabled={deleting === discount.id}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Valid From</p>
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        <p className="font-medium">
                          {new Date(discount.startDate).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Valid To</p>
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        <p className="font-medium">
                          {new Date(discount.endDate).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
