import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { createFileRoute } from '@tanstack/react-router'
import { Plus, Edit, Trash2, DollarSign } from 'lucide-react'

export const Route = createFileRoute('/_core/pricing/plans')({
  component: PricingPlans,
})

function PricingPlans() {
  // Sample data - replace with actual API calls
  const plans = [
    {
      id: 1,
      name: 'Starter',
      price: 29,
      billing: 'monthly',
      features: ['Up to 10 users', '2GB storage', 'Basic support'],
      active: true,
    },
    {
      id: 2,
      name: 'Professional',
      price: 99,
      billing: 'monthly',
      features: ['Up to 50 users', '10GB storage', 'Priority support', 'Advanced features'],
      active: true,
    },
    {
      id: 3,
      name: 'Enterprise',
      price: 299,
      billing: 'monthly',
      features: ['Unlimited users', 'Unlimited storage', '24/7 support', 'Custom features'],
      active: true,
    },
  ]

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-gray-100">Pricing Plans</h2>
          <p className="text-muted-foreground">Manage your subscription plans and pricing tiers</p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Add Plan
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {plans.map((plan) => (
          <Card key={plan.id} className="relative">
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle>{plan.name}</CardTitle>
                  <CardDescription>
                    <span className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                      ${plan.price}
                    </span>
                    <span className="text-muted-foreground">/{plan.billing}</span>
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button variant="ghost" size="icon">
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {plan.features.map((feature, index) => (
                  <li key={index} className="flex items-center text-sm">
                    <DollarSign className="mr-2 h-4 w-4 text-green-500" />
                    {feature}
                  </li>
                ))}
              </ul>
              <div className="mt-4">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  plan.active 
                    ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                    : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                }`}>
                  {plan.active ? 'Active' : 'Inactive'}
                </span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
