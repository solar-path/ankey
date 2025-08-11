import { Button } from '@/components/ui/button'
import { createFileRoute, Link } from '@tanstack/react-router'
import { ArrowRight, CheckCircle, Shield, Signature, Users, Zap } from 'lucide-react'

export const Route = createFileRoute('/_public/')({
  component: Index,
})

function Index() {
  return (
    <div className="flex flex-col">
      <section className="relative overflow-hidden py-32">
        <div className="absolute inset-x-0 top-0 flex h-full w-full items-center justify-center opacity-100">
          <img
            alt="background"
            src="./square-alt-grid.svg"
            className="[mask-image:radial-gradient(75%_75%_at_center,white,transparent)] opacity-90"
          />
        </div>
        <div className="relative z-10 container mx-auto">
          <div className="mx-auto flex max-w-5xl flex-col items-center">
            <div className="flex flex-col items-center gap-6 text-center">
              <div className="rounded-xl bg-background/30 p-4 shadow-sm backdrop-blur-sm">
                <img
                  src="https://deifkwefumgah.cloudfront.net/shadcnblocks/block/block-1.svg"
                  alt="logo"
                  className="h-16"
                />
              </div>
              <div>
                <h1 className="mb-6 text-2xl font-bold tracking-tight text-pretty lg:text-5xl">
                  Enterprise Compliance & Management Platform
                </h1>
                <p className="mx-auto max-w-3xl text-muted-foreground lg:text-xl">
                  Streamline your business operations with automated compliance, delegation of authority,
                  and comprehensive audit trails. Start with our 7-day free trial.
                </p>
              </div>
              <div className="mt-6 flex justify-center gap-3">
                <Button
                  className="shadow-sm transition-shadow hover:shadow"
                  asChild
                >
                  <Link to='/offers'>
                    Start Free Trial
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <Button variant="outline" className="group" asChild>
                  <Link to='/learn' search={{ doc: 'getting-started' }}>Learn more</Link>
                </Button>
              </div>
              <div className="mt-20 flex flex-col items-center gap-5">
                <p className="font-medium text-muted-foreground lg:text-left">
                  Key Features for Enterprise Management
                </p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-4">
                  <div className="flex flex-col items-center gap-2">
                    <div className="rounded-lg border p-3 bg-background/50">
                      <Shield size={24} className="text-blue-600 dark:text-blue-400" />
                    </div>
                    <span className="text-sm text-muted-foreground">SOC 2 Compliant</span>
                  </div>
                  <div className="flex flex-col items-center gap-2">
                    <div className="rounded-lg border p-3 bg-background/50">
                      <Users size={24} className="text-green-600 dark:text-green-400" />
                    </div>
                    <span className="text-sm text-muted-foreground">Multi-tenant</span>
                  </div>
                  <div className="flex flex-col items-center gap-2">
                    <div className="rounded-lg border p-3 bg-background/50">
                      <CheckCircle size={24} className="text-purple-600 dark:text-purple-400" />
                    </div>
                    <span className="text-sm text-muted-foreground">Audit Trails</span>
                  </div>
                  <div className="flex flex-col items-center gap-2">
                    <div className="rounded-lg border p-3 bg-background/50">
                      <Zap size={24} className="text-orange-600 dark:text-orange-400" />
                    </div>
                    <span className="text-sm text-muted-foreground">Automation</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* What We Do Section */}
      <section className="py-24 bg-gray-50 dark:bg-gray-900/50">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">What Our Platform Does</h2>
            <p className="text-lg text-muted-foreground">
              A comprehensive SaaS solution for managing business compliance, delegations, and operations
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/50 rounded-lg flex items-center justify-center mb-4">
                <Shield className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="font-semibold mb-2">SOC 2 Compliance</h3>
              <p className="text-sm text-muted-foreground">
                Built-in audit logging, security controls, and compliance reporting for SOC 2 Type II certification.
                Every action is tracked and logged automatically.
              </p>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
              <div className="w-12 h-12 bg-green-100 dark:bg-green-900/50 rounded-lg flex items-center justify-center mb-4">
                <Users className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
              <h3 className="font-semibold mb-2">Multi-Tenant Architecture</h3>
              <p className="text-sm text-muted-foreground">
                Create isolated workspaces for different organizations or departments. Each tenant has its own
                database, users, and configurations.
              </p>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
              <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/50 rounded-lg flex items-center justify-center mb-4">
                <Signature className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              </div>
              <h3 className="font-semibold mb-2">Delegation of Authority</h3>
              <p className="text-sm text-muted-foreground">
                Define approval workflows, delegate permissions, and manage authority levels. Track who approved
                what and when with complete audit trails.
              </p>
            </div>
          </div>

          <div className="mt-12 text-center">
            <Button size="lg" asChild>
              <Link to="/offers">
                View Pricing & Start Free Trial
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-24">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">How It Works</h2>
            <p className="text-lg text-muted-foreground">
              Get started in minutes with our simple onboarding process
            </p>
          </div>

          <div className="max-w-4xl mx-auto">
            <div className="space-y-8">
              <div className="flex gap-4 items-start">
                <div className="flex-shrink-0 w-10 h-10 bg-blue-600 text-white rounded-full flex items-center justify-center font-semibold">
                  1
                </div>
                <div>
                  <h3 className="font-semibold mb-1">Choose Your Plan</h3>
                  <p className="text-muted-foreground">
                    Select from our flexible pricing plans. Start with a 7-day free trial with up to 5 users.
                  </p>
                </div>
              </div>

              <div className="flex gap-4 items-start">
                <div className="flex-shrink-0 w-10 h-10 bg-blue-600 text-white rounded-full flex items-center justify-center font-semibold">
                  2
                </div>
                <div>
                  <h3 className="font-semibold mb-1">Create Your Workspace</h3>
                  <p className="text-muted-foreground">
                    Register your workspace with a unique subdomain. Your isolated environment will be ready instantly.
                  </p>
                </div>
              </div>

              <div className="flex gap-4 items-start">
                <div className="flex-shrink-0 w-10 h-10 bg-blue-600 text-white rounded-full flex items-center justify-center font-semibold">
                  3
                </div>
                <div>
                  <h3 className="font-semibold mb-1">Invite Your Team</h3>
                  <p className="text-muted-foreground">
                    Add team members, assign roles, and set up approval workflows according to your organization's needs.
                  </p>
                </div>
              </div>

              <div className="flex gap-4 items-start">
                <div className="flex-shrink-0 w-10 h-10 bg-green-600 text-white rounded-full flex items-center justify-center font-semibold">
                  <CheckCircle className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-semibold mb-1">You're All Set!</h3>
                  <p className="text-muted-foreground">
                    Start managing your business with automated compliance, comprehensive audit trails, and streamlined operations.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
