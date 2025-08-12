import { RegisterWorkspaceForm } from '@/components/auth/RegisterWorkspaceForm'
import { useDrawer } from '@/components/QDrawer/QDrawer.store'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { client, handleApiResponse } from '@/lib/rpc'
import { createFileRoute } from '@tanstack/react-router'
import { Check, Loader2 } from 'lucide-react'
import { useEffect, useState } from 'react'

export const Route = createFileRoute('/_public/offers')({
  component: OffersPage,
})

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

interface PricingCalculation {
  planId: string
  planName: string
  userCount: number
  billingCycle: 'monthly' | 'yearly'
  pricePerUser: number
  basePrice: number
  discountPercent: number
  discountAmount: number
  finalPrice: number
  periodicPrice: number
  trialDays: number | null
}

function OffersPage() {
  const { openDrawer } = useDrawer()

  const [pricingPlans, setPricingPlans] = useState<PricingPlan[]>([])
  const [loading, setLoading] = useState(true)
  const [calculations, setCalculations] = useState<Record<string, PricingCalculation>>({})
  const [userCounts, setUserCounts] = useState<Record<string, number>>({})
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly')
  const [promoCode, setPromoCode] = useState('')

  useEffect(() => {
    fetchPricingPlans()
  }, [])

  useEffect(() => {
    if (pricingPlans.length > 0) {
      calculatePricing()
    }
  }, [pricingPlans, userCounts, billingCycle, promoCode])

  const fetchPricingPlans = async () => {
    try {
      const response = await client.pricing.plans.$get()
      const result = await handleApiResponse(response)

      if (result.success && result.data) {
        // API returns { plans: [...] }
        const plans = (result.data as any).plans || []
        if (!Array.isArray(plans)) {
          console.error('Expected plans array but got:', plans)
          return
        }
        setPricingPlans(plans)

        // Set default user counts
        const defaultCounts: Record<string, number> = {}
        plans.forEach((plan: PricingPlan) => {
          defaultCounts[plan.id] = plan.minUsers || 1
        })
        setUserCounts(defaultCounts)
      } else {
        console.error('Error fetching pricing plans:', result.error)
      }
    } catch (error) {
      console.error('Error fetching pricing plans:', error)
    } finally {
      setLoading(false)
    }
  }

  const calculatePricing = async () => {
    const newCalculations: Record<string, PricingCalculation> = {}

    for (const plan of pricingPlans) {
      const userCount = userCounts[plan.id] || plan.minUsers || 1

      try {
        const response = await client.pricing.calculate.$post({
          json: {
            planId: plan.id,
            userCount,
            billingCycle,
            discountCode: promoCode || undefined,
          },
        })

        const result = await handleApiResponse(response)
        if (result.success) {
          newCalculations[plan.id] = result.data as PricingCalculation
        }
      } catch (error) {
        console.error(`Error calculating pricing for plan ${plan.id}:`, error)
      }
    }

    setCalculations(newCalculations)
  }

  const parseFeatures = (featuresStr: string): string[] => {
    try {
      return JSON.parse(featuresStr)
    } catch {
      return featuresStr
        .split(',')
        .map(f => f.trim())
        .filter(Boolean)
    }
  }

  const handleGetStarted = (plan: PricingPlan) => {
    if (plan.trialDays && plan.trialDays > 0) {
      // Open drawer with RegisterWorkspaceForm for free trial
      openDrawer(<RegisterWorkspaceForm />)
    } else {
      console.log(`Selecting ${plan.name} plan...`, plan)
      // TODO: Implement plan selection for non-trial plans
    }
  }

  const handleUserCountChange = (planId: string, count: number) => {
    setUserCounts(prev => ({ ...prev, [planId]: count }))
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-16 flex justify-center items-center">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading pricing plans...</span>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-16">
      {/* Header */}
      <div className="text-center mb-16">
        <h1 className="text-4xl font-bold mb-4">Special Offers & Pricing</h1>
        <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
          Take advantage of our special offers. Choose the perfect plan for your business and start
          with our free trial.
        </p>
      </div>

      {/* Billing Toggle */}
      <div className="flex justify-center mb-8">
        <ToggleGroup
          type="single"
          value={billingCycle}
          onValueChange={value => value && setBillingCycle(value as 'monthly' | 'yearly')}
          className="border rounded-lg"
        >
          <ToggleGroupItem value="monthly" className="px-6 py-2">
            Monthly
          </ToggleGroupItem>
          <ToggleGroupItem value="yearly" className="px-6 py-2">
            Yearly
            <span className="ml-1 text-green-600 dark:text-green-400 font-semibold">(-15%)</span>
          </ToggleGroupItem>
        </ToggleGroup>
      </div>

      {/* Promo Code */}
      <div className="max-w-md mx-auto mb-8">
        {promoCode ? (
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium text-green-800 dark:text-green-200">
                  Promo code applied
                </div>
                <div className="text-lg font-semibold text-green-900 dark:text-green-100">
                  {promoCode}
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setPromoCode('')}
                className="text-green-700 dark:text-green-300 hover:text-green-900 dark:hover:text-green-100"
              >
                Remove
              </Button>
            </div>
          </div>
        ) : (
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-full">
                Have a promo code? Click here
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80">
              <div className="grid gap-4">
                <div className="space-y-2">
                  <Label htmlFor="promoCode">Promo Code</Label>
                  <Input
                    id="promoCode"
                    placeholder="Enter your promo code"
                    value={promoCode}
                    onChange={e => setPromoCode(e.target.value)}
                  />
                </div>
              </div>
            </PopoverContent>
          </Popover>
        )}
      </div>

      {/* Pricing Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-16 max-w-7xl mx-auto">
        {pricingPlans
          .sort((a, b) => a.pricePerUserPerMonth - b.pricePerUserPerMonth)
          .map(plan => {
            const calculation = calculations[plan.id]
            const features = parseFeatures(plan.features)
            const userCount = userCounts[plan.id] || plan.minUsers || 1
            const hasPopularBadge = plan.badge === 'Popular' || plan.badge === 'Most Popular'

            return (
              <Card
                key={plan.id}
                className={`relative flex flex-col h-full ${
                  hasPopularBadge ? 'border-blue-500 ring-2 ring-blue-200 dark:ring-blue-700' : ''
                }`}
              >
                {plan.badge && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 z-10">
                    <span className="bg-blue-500 dark:bg-blue-600 text-white px-3 py-1 rounded-full text-sm font-medium">
                      {plan.badge}
                    </span>
                  </div>
                )}

                <CardHeader className="text-center">
                  <CardTitle className="text-2xl">{plan.name}</CardTitle>

                  {/* User Count Selector */}
                  <div className="mb-4">
                    <Label
                      htmlFor={`users-${plan.id}`}
                      className="text-sm text-gray-600 dark:text-gray-300"
                    >
                      Number of users
                    </Label>
                    <div className="flex items-center justify-center mt-1">
                      <button
                        onClick={() =>
                          handleUserCountChange(
                            plan.id,
                            Math.max(plan.minUsers || 1, userCount - 1)
                          )
                        }
                        className="w-10 h-10 rounded-l border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600 flex items-center justify-center"
                        disabled={userCount <= (plan.minUsers || 1)}
                      >
                        -
                      </button>
                      <Input
                        id={`users-${plan.id}`}
                        type="number"
                        min={plan.minUsers || 1}
                        max={plan.maxUsers || undefined}
                        value={userCount}
                        onChange={e =>
                          handleUserCountChange(
                            plan.id,
                            parseInt(e.target.value) || plan.minUsers || 1
                          )
                        }
                        className="w-20 h-10 text-center border-t border-b border-gray-300 dark:border-gray-600 rounded-none dark:bg-gray-800 dark:text-gray-100"
                      />
                      <button
                        onClick={() =>
                          handleUserCountChange(
                            plan.id,
                            Math.min(plan.maxUsers || 999, userCount + 1)
                          )
                        }
                        className="w-10 h-10 rounded-r border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600 flex items-center justify-center"
                        disabled={plan.maxUsers ? userCount >= plan.maxUsers : false}
                      >
                        +
                      </button>
                    </div>
                  </div>

                  <div className="mb-2">
                    {calculation ? (
                      <div>
                        {billingCycle === 'yearly' ? (
                          <>
                            <div className="text-4xl font-bold">
                              ${Math.round(calculation.periodicPrice * 12)}
                            </div>
                            <div className="text-gray-600 dark:text-gray-300 text-sm">
                              total annually
                              <div className="text-xs text-green-600 dark:text-green-400 font-medium">
                                (${Math.round(calculation.periodicPrice)} per month)
                              </div>
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                              ${(calculation.pricePerUser || plan.pricePerUserPerMonth).toFixed(2)}{' '}
                              per user per month
                            </div>
                          </>
                        ) : (
                          <>
                            <div className="text-4xl font-bold">${calculation.finalPrice}</div>
                            <div className="text-gray-600 dark:text-gray-300 text-sm">
                              per month
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                              ${(calculation.pricePerUser || plan.pricePerUserPerMonth).toFixed(2)}{' '}
                              per user per month
                            </div>
                          </>
                        )}
                        {calculation.discountPercent > 0 && (
                          <div className="text-green-600 dark:text-green-400 text-sm font-medium mt-1">
                            {calculation.discountPercent}% discount applied!
                          </div>
                        )}
                      </div>
                    ) : (
                      <div>
                        {billingCycle === 'yearly' ? (
                          <>
                            <div className="text-4xl font-bold">
                              ${Math.round(plan.pricePerUserPerMonth * userCount * 0.85 * 12)}
                            </div>
                            <div className="text-gray-600 dark:text-gray-300 text-sm">
                              total annually
                              <div className="text-xs text-green-600 dark:text-green-400 font-medium">
                                (${Math.round(plan.pricePerUserPerMonth * userCount * 0.85)} per
                                month)
                              </div>
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                              ${(plan.pricePerUserPerMonth * 0.85).toFixed(2)} per user per month
                            </div>
                          </>
                        ) : (
                          <>
                            <div className="text-4xl font-bold">
                              ${plan.pricePerUserPerMonth * userCount}
                            </div>
                            <div className="text-gray-600 dark:text-gray-300 text-sm">
                              per month
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                              ${plan.pricePerUserPerMonth.toFixed(2)} per user per month
                            </div>
                          </>
                        )}
                      </div>
                    )}
                  </div>

                  <CardDescription className="text-sm">{plan.description}</CardDescription>
                  {plan.trialDays && plan.trialDays > 0 && (
                    <p className="text-blue-600 dark:text-blue-400 font-medium mt-2">
                      {plan.trialDays} days free trial ({plan.trialMaxUsers || 5} users)
                    </p>
                  )}
                </CardHeader>

                <CardContent className="flex-1">
                  <div className="mb-6">
                    <h4 className="font-semibold mb-4">Features included:</h4>
                    <ul className="space-y-2">
                      {features.map((feature, featureIndex) => (
                        <li key={featureIndex} className="flex items-start">
                          <Check className="h-5 w-5 text-green-500 dark:text-green-400 mr-2 mt-0.5 flex-shrink-0" />
                          <span className="text-sm">{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {(plan.minUsers || plan.maxUsers) && (
                    <div className="mb-6">
                      <h4 className="font-semibold mb-4 text-muted-foreground">User Limits:</h4>
                      <ul className="space-y-2">
                        {plan.minUsers && (
                          <li className="flex items-start">
                            <span className="text-sm text-muted-foreground">
                              Minimum {plan.minUsers} users
                            </span>
                          </li>
                        )}
                        {plan.maxUsers && (
                          <li className="flex items-start">
                            <span className="text-sm text-muted-foreground">
                              Maximum {plan.maxUsers} users
                            </span>
                          </li>
                        )}
                      </ul>
                    </div>
                  )}
                </CardContent>

                <CardFooter>
                  <Button
                    className="w-full"
                    onClick={() => handleGetStarted(plan)}
                    variant={hasPopularBadge ? 'default' : 'outline'}
                  >
                    {plan.trialDays && plan.trialDays > 0 ? 'Start Free Trial' : 'Choose Plan'}
                  </Button>
                </CardFooter>
              </Card>
            )
          })}
      </div>

      {/* FAQ Section */}
      <div className="max-w-3xl mx-auto">
        <h2 className="text-3xl font-bold text-center mb-12 dark:text-gray-100">
          Frequently Asked Questions
        </h2>
        <Accordion
          type="multiple"
          defaultValue={['item-1', 'item-2', 'item-3', 'item-4']}
          className="w-full"
        >
          <AccordionItem value="item-1">
            <AccordionTrigger className="text-left">Can I change plans later?</AccordionTrigger>
            <AccordionContent>
              <p className="text-gray-600 dark:text-gray-300">
                Yes, you can upgrade or downgrade your plan at any time. Changes will be reflected
                in your next billing cycle.
              </p>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="item-2">
            <AccordionTrigger className="text-left">
              What happens after the free trial?
            </AccordionTrigger>
            <AccordionContent>
              <p className="text-gray-600 dark:text-gray-300">
                After your 7-day free trial, you can choose to continue with a paid plan. If you
                don't select a plan, your account will be suspended but your data will be preserved
                for 30 days.
              </p>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="item-3">
            <AccordionTrigger className="text-left">
              Do you offer discounts for annual billing?
            </AccordionTrigger>
            <AccordionContent>
              <p className="text-gray-600 dark:text-gray-300">
                Yes! Save 15% when you pay annually. We also offer promotional discounts from time
                to time - use the promo code field above to apply any available discounts.
              </p>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="item-4">
            <AccordionTrigger className="text-left">What support is included?</AccordionTrigger>
            <AccordionContent>
              <p className="text-gray-600 dark:text-gray-300">
                All plans include email support. Professional and Enterprise plans include priority
                support with faster response times.
              </p>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>
    </div>
  )
}
