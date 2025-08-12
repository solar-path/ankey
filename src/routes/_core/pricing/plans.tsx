import { useDrawer } from '@/components/QDrawer/QDrawer.store'
import { PlanForm } from '@/components/pricing/PlanForm'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { client } from '@/lib/rpc'
import { createFileRoute } from '@tanstack/react-router'
import { Building2, Calendar, Check, Edit, Plus, Trash2, Users } from 'lucide-react'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'

export const Route = createFileRoute('/_core/pricing/plans')({
  component: PricingPlans,
})

interface PricingPlan {
  id: string
  name: string
  description?: string | null
  pricePerUserPerMonth: number
  minUsers?: number | null
  maxUsers?: number | null
  maxCompanies?: number | null
  features: string
  trialDays?: number | null
  trialMaxUsers?: number | null
  displayOrder: number
  badge?: string | null
  isActive: boolean
  createdAt: string
  updatedAt: string
}

function PricingPlans() {
  const [plans, setPlans] = useState<PricingPlan[]>([])
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState<string | null>(null)
  const { openDrawer, closeDrawer } = useDrawer()

  useEffect(() => {
    fetchPlans()
  }, [])

  const fetchPlans = async () => {
    try {
      setLoading(true)
      const response = await client.pricing.plans.$get()

      if (response.ok) {
        const data = await response.json()
        setPlans(data.plans)
      } else {
        toast.error('Failed to load pricing plans')
      }
    } catch (error) {
      console.error('Error fetching plans:', error)
      toast.error('Failed to load pricing plans')
    } finally {
      setLoading(false)
    }
  }

  const handleDeletePlan = async (planId: string) => {
    try {
      setDeleting(planId)
      const response = await client.pricing.plans[':id'].$delete({
        param: { id: planId },
      })

      if (response.ok) {
        toast.success('Plan deleted successfully')
        await fetchPlans()
      } else {
        toast.error('Failed to delete plan')
      }
    } catch (error) {
      console.error('Error deleting plan:', error)
      toast.error('Failed to delete plan')
    } finally {
      setDeleting(null)
    }
  }

  const parseFeatures = (features: string): string[] => {
    try {
      return JSON.parse(features)
    } catch {
      return []
    }
  }

  const handleCreatePlan = () => {
    openDrawer(
      'Create New Plan',
      'Add a new pricing plan to your offerings',
      <PlanForm
        onSuccess={() => {
          closeDrawer()
          fetchPlans()
        }}
      />
    )
  }

  const handleEditPlan = (plan: PricingPlan) => {
    const initialData = {
      name: plan.name,
      description: plan.description || '',
      features: parseFeatures(plan.features).join('\n'),
      pricePerUserPerMonth: plan.pricePerUserPerMonth,
      minUsers: plan.minUsers || undefined,
      maxUsers: plan.maxUsers || undefined,
      maxCompanies: plan.maxCompanies || undefined,
      trialDays: plan.trialDays || undefined,
      trialMaxUsers: plan.trialMaxUsers || undefined,
      badge: plan.badge || '',
      isActive: plan.isActive,
    }

    openDrawer(
      'Edit Plan',
      'Update the pricing plan details',
      <PlanForm
        planId={plan.id}
        initialData={initialData}
        onSuccess={() => {
          closeDrawer()
          fetchPlans()
        }}
      />
    )
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-gray-100">
              Pricing Plans
            </h2>
            <p className="text-muted-foreground">
              Manage your subscription plans and pricing tiers
            </p>
          </div>
          <Skeleton className="h-10 w-28" />
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map(i => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-32 mb-2" />
                <Skeleton className="h-8 w-24" />
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                </div>
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
            Pricing Plans
          </h2>
          <p className="text-muted-foreground">Manage your subscription plans and pricing tiers</p>
        </div>
        <Button onClick={() => handleCreatePlan()}>
          <Plus className="mr-2 h-4 w-4" />
          Add Plan
        </Button>
      </div>

      {plans.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <p className="text-muted-foreground mb-4">No pricing plans found</p>
            <Button onClick={() => handleCreatePlan()}>
              <Plus className="mr-2 h-4 w-4" />
              Create Your First Plan
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {plans.map(plan => (
            <Card key={plan.id} className="relative">
              {plan.badge && (
                <div className="absolute -top-2 -right-2 bg-blue-600 text-white px-2 py-1 rounded-full text-xs font-semibold">
                  {plan.badge}
                </div>
              )}
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle>{plan.name}</CardTitle>
                    <CardDescription>
                      <span className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                        ${plan.pricePerUserPerMonth}
                      </span>
                      <span className="text-muted-foreground">/user/month</span>
                    </CardDescription>
                    {plan.description && (
                      <p className="text-sm text-muted-foreground mt-2">{plan.description}</p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="icon" onClick={() => handleEditPlan(plan)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeletePlan(plan.id)}
                      disabled={deleting === plan.id}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {/* User Limits */}
                  {(plan.minUsers || plan.maxUsers) && (
                    <div className="flex items-center text-sm text-muted-foreground">
                      <Users className="mr-2 h-4 w-4" />
                      {plan.minUsers && plan.maxUsers ? (
                        <span>
                          {plan.minUsers} - {plan.maxUsers} users
                        </span>
                      ) : plan.minUsers ? (
                        <span>Min {plan.minUsers} users</span>
                      ) : (
                        <span>Max {plan.maxUsers} users</span>
                      )}
                    </div>
                  )}

                  {/* Company Limits */}
                  {plan.maxCompanies && (
                    <div className="flex items-center text-sm text-muted-foreground">
                      <Building2 className="mr-2 h-4 w-4" />
                      <span>Up to {plan.maxCompanies} companies</span>
                    </div>
                  )}

                  {/* Trial Info */}
                  {plan.trialDays && (
                    <div className="flex items-center text-sm text-muted-foreground">
                      <Calendar className="mr-2 h-4 w-4" />
                      <span>{plan.trialDays} day trial</span>
                      {plan.trialMaxUsers && (
                        <span className="ml-1">(up to {plan.trialMaxUsers} users)</span>
                      )}
                    </div>
                  )}

                  {/* Features */}
                  <div className="pt-2">
                    <p className="text-sm font-medium mb-2">Features:</p>
                    <ul className="space-y-1">
                      {parseFeatures(plan.features).map((feature, index) => (
                        <li key={index} className="flex items-start text-sm">
                          <Check className="mr-2 h-4 w-4 text-green-500 flex-shrink-0 mt-0.5" />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-between">
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      plan.isActive
                        ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                        : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                    }`}
                  >
                    {plan.isActive ? 'Active' : 'Inactive'}
                  </span>
                  <span className="text-xs text-muted-foreground">Order: {plan.displayOrder}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
