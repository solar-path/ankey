import { createFileRoute } from '@tanstack/react-router'
import { Button } from '@/components/ui/button'
import { Check, Loader2 } from 'lucide-react'
import { useState, useEffect } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { corePricing, handleApiResponse } from '@/lib/rpc'

export const Route = createFileRoute('/_public/pricing')({
  component: Pricing,
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

function Pricing() {
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
      const response = await corePricing.plans.$get()
      const result = await handleApiResponse(response)

      if (result.success) {
        const plans = result.data?.plans || []
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
        const response = await corePricing.calculate.$post({
          json: {
            planId: plan.id,
            userCount,
            billingCycle,
            discountCode: promoCode || undefined,
          },
        })

        const result = await handleApiResponse(response)
        if (result.success) {
          newCalculations[plan.id] = result.data
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
      console.log('Starting free trial...', plan)
      // TODO: Implement trial signup
    } else {
      console.log(`Selecting ${plan.name} plan...`, plan)
      // TODO: Implement plan selection
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
        <h1 className="text-4xl font-bold mb-4">Simple, Transparent Pricing</h1>
        <p className="text-xl text-gray-600 max-w-3xl mx-auto">
          Choose the perfect plan for your business. Start with our free trial and scale as you
          grow.
        </p>
      </div>

      {/* Special Trial Offer */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-6 mb-12 text-center">
        <h2 className="text-2xl font-semibold mb-2 text-blue-900">🎉 Free 7-Day Trial</h2>
        <p className="text-blue-700 mb-4">
          Get full access to our platform with up to 5 users for 1 week - no credit card required!
        </p>
        <Button
          onClick={() => console.log('Starting free trial...')}
          className="bg-blue-600 hover:bg-blue-700"
        >
          Start Free Trial
        </Button>
      </div>

      {/* Billing Toggle */}
      <div className="flex justify-center mb-8">
        <div className="bg-gray-100 p-1 rounded-lg">
          <button
            onClick={() => setBillingCycle('monthly')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              billingCycle === 'monthly'
                ? 'bg-white text-gray-900 shadow'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Monthly
          </button>
          <button
            onClick={() => setBillingCycle('yearly')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              billingCycle === 'yearly'
                ? 'bg-white text-gray-900 shadow'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Yearly
            <span className="ml-1 text-green-600 font-semibold">(-15%)</span>
          </button>
        </div>
      </div>

      {/* Promo Code */}
      <div className="max-w-md mx-auto mb-8">
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
      </div>

      {/* Pricing Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 mb-16">
        {pricingPlans
          .sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0))
          .map(plan => {
            const calculation = calculations[plan.id]
            const features = parseFeatures(plan.features)
            const userCount = userCounts[plan.id] || plan.minUsers || 1
            const hasPopularBadge = plan.badge === 'Popular' || plan.badge === 'Most Popular'

            return (
              <div
                key={plan.id}
                className={`relative bg-white rounded-lg shadow-lg border-2 p-8 ${
                  hasPopularBadge ? 'border-blue-500 ring-2 ring-blue-200' : 'border-gray-200'
                }`}
              >
                {plan.badge && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <span className="bg-blue-500 text-white px-3 py-1 rounded-full text-sm font-medium">
                      {plan.badge}
                    </span>
                  </div>
                )}

                <div className="text-center mb-8">
                  <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>

                  {/* User Count Selector */}
                  <div className="mb-4">
                    <Label htmlFor={`users-${plan.id}`} className="text-sm text-gray-600">
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
                        className="w-8 h-8 rounded-l border border-gray-300 bg-gray-50 text-gray-600 hover:bg-gray-100"
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
                        className="w-20 h-8 text-center border-t border-b border-gray-300 rounded-none"
                      />
                      <button
                        onClick={() =>
                          handleUserCountChange(
                            plan.id,
                            Math.min(plan.maxUsers || 999, userCount + 1)
                          )
                        }
                        className="w-8 h-8 rounded-r border border-gray-300 bg-gray-50 text-gray-600 hover:bg-gray-100"
                        disabled={plan.maxUsers ? userCount >= plan.maxUsers : false}
                      >
                        +
                      </button>
                    </div>
                  </div>

                  <div className="mb-2">
                    {calculation ? (
                      <div>
                        <div className="text-4xl font-bold">
                          $
                          {billingCycle === 'yearly'
                            ? Math.round(calculation.periodicPrice)
                            : calculation.finalPrice}
                        </div>
                        <div className="text-gray-600 text-sm">
                          per {billingCycle === 'yearly' ? 'month' : 'month'}
                          {billingCycle === 'yearly' && (
                            <div className="text-xs text-green-600 font-medium">
                              (${calculation.finalPrice} billed annually)
                            </div>
                          )}
                        </div>
                        {calculation.discountPercent > 0 && (
                          <div className="text-green-600 text-sm font-medium mt-1">
                            {calculation.discountPercent}% discount applied!
                          </div>
                        )}
                      </div>
                    ) : (
                      <div>
                        <div className="text-4xl font-bold">
                          ${plan.pricePerUserPerMonth * userCount}
                        </div>
                        <div className="text-gray-600">per month</div>
                      </div>
                    )}
                  </div>

                  <p className="text-gray-600 text-sm">{plan.description}</p>
                  {plan.trialDays && plan.trialDays > 0 && (
                    <p className="text-blue-600 font-medium mt-2">
                      {plan.trialDays} days free trial ({plan.trialMaxUsers || 5} users)
                    </p>
                  )}
                </div>

                <div className="mb-8">
                  <h4 className="font-semibold mb-4">Features included:</h4>
                  <ul className="space-y-2">
                    {features.map((feature, featureIndex) => (
                      <li key={featureIndex} className="flex items-start">
                        <Check className="h-5 w-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                        <span className="text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {(plan.minUsers || plan.maxUsers) && (
                  <div className="mb-8">
                    <h4 className="font-semibold mb-4 text-gray-700">User Limits:</h4>
                    <ul className="space-y-2">
                      {plan.minUsers && (
                        <li className="flex items-start">
                          <span className="text-sm text-gray-600">
                            Minimum {plan.minUsers} users
                          </span>
                        </li>
                      )}
                      {plan.maxUsers && (
                        <li className="flex items-start">
                          <span className="text-sm text-gray-600">
                            Maximum {plan.maxUsers} users
                          </span>
                        </li>
                      )}
                    </ul>
                  </div>
                )}

                <Button
                  onClick={() => handleGetStarted(plan)}
                  className={`w-full ${
                    hasPopularBadge
                      ? 'bg-blue-600 hover:bg-blue-700'
                      : 'bg-gray-600 hover:bg-gray-700'
                  }`}
                  variant={hasPopularBadge ? 'default' : 'outline'}
                >
                  {plan.trialDays && plan.trialDays > 0 ? 'Start Free Trial' : 'Get Started'}
                </Button>
              </div>
            )
          })}
      </div>

      {/* FAQ Section */}
      <div className="max-w-3xl mx-auto">
        <h2 className="text-3xl font-bold text-center mb-12">Frequently Asked Questions</h2>
        <div className="space-y-8">
          <div>
            <h3 className="text-xl font-semibold mb-3">Can I change plans later?</h3>
            <p className="text-gray-600">
              Yes, you can upgrade or downgrade your plan at any time. Changes will be reflected in
              your next billing cycle.
            </p>
          </div>

          <div>
            <h3 className="text-xl font-semibold mb-3">What happens after the free trial?</h3>
            <p className="text-gray-600">
              After your 7-day free trial, you can choose to continue with a paid plan. If you don't
              select a plan, your account will be suspended but your data will be preserved for 30
              days.
            </p>
          </div>

          <div>
            <h3 className="text-xl font-semibold mb-3">
              Do you offer discounts for annual billing?
            </h3>
            <p className="text-gray-600">
              Yes! Save 15% when you pay annually. We also offer promotional discounts from time to
              time - use the promo code field above to apply any available discounts.
            </p>
          </div>

          <div>
            <h3 className="text-xl font-semibold mb-3">What support is included?</h3>
            <p className="text-gray-600">
              All plans include email support. Professional and Enterprise plans include priority
              support with faster response times.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
