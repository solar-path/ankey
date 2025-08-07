import { createFileRoute } from '@tanstack/react-router'
import PublicLayout from './publicLayout'
import { Button } from '@/components/ui/button'
import { Check, X } from 'lucide-react'

export const Route = createFileRoute('/(public)/pricing')({
  component: Pricing,
})

interface PricingPlan {
  name: string
  price: string
  description: string
  features: string[]
  limitations: string[]
  popular?: boolean
  trialDays?: number
}

const pricingPlans: PricingPlan[] = [
  {
    name: 'Free Trial',
    price: '$0',
    description: 'Perfect for trying out our platform',
    trialDays: 7,
    features: [
      'Up to 5 users',
      'Basic workspace functionality',
      'Email support',
      'Core business modules',
      'Basic reporting',
      'Data export (CSV)',
    ],
    limitations: ['Limited to 7 days', 'No advanced integrations', 'Basic support only'],
  },
  {
    name: 'Starter',
    price: '$25',
    description: 'Essential features for small teams',
    features: [
      'Up to 10 users',
      'All core business modules',
      'Email & chat support',
      'Advanced reporting',
      'Data export (PDF, Excel, CSV)',
      'Basic integrations',
      'Custom workspace branding',
    ],
    limitations: ['Limited integrations', 'Standard support hours'],
  },
  {
    name: 'Professional',
    price: '$50',
    description: 'Advanced features for growing businesses',
    popular: true,
    features: [
      'Up to 25 users',
      'All business modules + accounting',
      'Priority support',
      'Advanced analytics & dashboards',
      'API access',
      'All export formats',
      'Custom integrations',
      'Role-based access control',
      'Audit logs',
      'SSO integration',
    ],
    limitations: ['Limited to 25 users'],
  },
  {
    name: 'Enterprise',
    price: 'Custom',
    description: 'Unlimited scalability for large organizations',
    features: [
      'Unlimited users',
      'All modules including reserved features',
      '24/7 dedicated support',
      'Custom development',
      'On-premise deployment option',
      'Advanced security features',
      'Custom SLA',
      'Training & onboarding',
      'Multi-tenant architecture',
      'White-label options',
    ],
    limitations: [],
  },
]

function Pricing() {
  const handleGetStarted = (planName: string) => {
    if (planName === 'Free Trial') {
      console.log('Starting free trial...')
      // TODO: Implement trial signup
    } else {
      console.log(`Selecting ${planName} plan...`)
      // TODO: Implement plan selection
    }
  }

  const handleContactSales = () => {
    console.log('Contacting sales...')
    // TODO: Open inquiry form
  }

  return (
    <PublicLayout>
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
            onClick={() => handleGetStarted('Free Trial')}
            className="bg-blue-600 hover:bg-blue-700"
          >
            Start Free Trial
          </Button>
        </div>

        {/* Pricing Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
          {pricingPlans.map((plan, index) => (
            <div
              key={index}
              className={`relative bg-white rounded-lg shadow-lg border-2 p-8 ${
                plan.popular ? 'border-blue-500 ring-2 ring-blue-200' : 'border-gray-200'
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <span className="bg-blue-500 text-white px-3 py-1 rounded-full text-sm font-medium">
                    Most Popular
                  </span>
                </div>
              )}

              <div className="text-center mb-8">
                <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
                <div className="mb-2">
                  <span className="text-4xl font-bold">{plan.price}</span>
                  {plan.price !== 'Custom' && plan.price !== '$0' && (
                    <span className="text-gray-600">/user/month</span>
                  )}
                </div>
                <p className="text-gray-600">{plan.description}</p>
                {plan.trialDays && (
                  <p className="text-blue-600 font-medium mt-2">{plan.trialDays} days free</p>
                )}
              </div>

              <div className="mb-8">
                <h4 className="font-semibold mb-4">Features included:</h4>
                <ul className="space-y-2">
                  {plan.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-start">
                      <Check className="h-5 w-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {plan.limitations.length > 0 && (
                <div className="mb-8">
                  <h4 className="font-semibold mb-4 text-gray-700">Limitations:</h4>
                  <ul className="space-y-2">
                    {plan.limitations.map((limitation, limitIndex) => (
                      <li key={limitIndex} className="flex items-start">
                        <X className="h-5 w-5 text-gray-400 mr-2 mt-0.5 flex-shrink-0" />
                        <span className="text-sm text-gray-600">{limitation}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <Button
                onClick={() =>
                  plan.name === 'Enterprise' ? handleContactSales() : handleGetStarted(plan.name)
                }
                className={`w-full ${
                  plan.popular
                    ? 'bg-blue-600 hover:bg-blue-700'
                    : plan.name === 'Enterprise'
                      ? 'bg-gray-800 hover:bg-gray-900'
                      : 'bg-gray-600 hover:bg-gray-700'
                }`}
                variant={plan.popular ? 'default' : 'outline'}
              >
                {plan.name === 'Enterprise' ? 'Contact Sales' : 'Get Started'}
              </Button>
            </div>
          ))}
        </div>

        {/* FAQ Section */}
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">Frequently Asked Questions</h2>
          <div className="space-y-8">
            <div>
              <h3 className="text-xl font-semibold mb-3">Can I change plans later?</h3>
              <p className="text-gray-600">
                Yes, you can upgrade or downgrade your plan at any time. Changes will be reflected
                in your next billing cycle.
              </p>
            </div>

            <div>
              <h3 className="text-xl font-semibold mb-3">What happens after the free trial?</h3>
              <p className="text-gray-600">
                After your 7-day free trial, you can choose to continue with a paid plan. If you
                don't select a plan, your account will be suspended but your data will be preserved
                for 30 days.
              </p>
            </div>

            <div>
              <h3 className="text-xl font-semibold mb-3">
                Do you offer discounts for annual billing?
              </h3>
              <p className="text-gray-600">
                Yes! Save 20% when you pay annually. Contact our sales team for custom pricing on
                Enterprise plans.
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
    </PublicLayout>
  )
}
