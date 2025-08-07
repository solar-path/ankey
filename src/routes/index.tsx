import { useDrawer } from '@/components/QDrawer/QDrawer.store'
import { RegisterWorkspaceForm } from '@/components/auth/RegisterWorkspaceForm'
import { Button } from '@/components/ui/button'
import { createFileRoute } from '@tanstack/react-router'
import { Banknote, Container, Signature, Users } from 'lucide-react'

export const Route = createFileRoute('/')({
  component: Index,
})

function Index() {
  const { openDrawer } = useDrawer()

  const handleGetStarted = () => {
    openDrawer(
      <RegisterWorkspaceForm
        onSubmit={async data => {
          // TODO: Implement registration logic
          console.log('Register:', data)
        }}
      />
    )
  }

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
                  Running a Business Smartly
                </h1>
                <p className="mx-auto max-w-3xl text-muted-foreground lg:text-xl">
                  Do your business as usual, we take care of the compliance, procedures, rules and
                  regulations.
                </p>
              </div>
              <div className="mt-6 flex justify-center gap-3">
                <Button
                  className="shadow-sm transition-shadow hover:shadow"
                  onClick={handleGetStarted}
                >
                  Get Started
                </Button>
                <Button variant="outline" className="group">
                  Learn more
                </Button>
              </div>
              <div className="mt-20 flex flex-col items-center gap-5">
                <p className="font-medium text-muted-foreground lg:text-left">
                  Allocate, authorize, pay and manage suppliers
                </p>
                <div className="flex flex-wrap items-center justify-center gap-4">
                  <Button
                    variant="outline"
                    className="group flex aspect-square h-12 items-center justify-center p-0"
                  >
                    <Banknote size={24} className="transition-all group-hover:scale-110" />
                  </Button>
                  <Button
                    variant="outline"
                    className="group flex aspect-square h-12 items-center justify-center p-0"
                  >
                    <Container size={24} className="transition-all group-hover:scale-110" />
                  </Button>
                  <Button
                    variant="outline"
                    className="group flex aspect-square h-12 items-center justify-center p-0"
                  >
                    <Users size={24} className="transition-all group-hover:scale-110" />
                  </Button>
                  <Button
                    variant="outline"
                    className="group flex aspect-square h-12 items-center justify-center p-0"
                  >
                    <Signature size={24} className="transition-all group-hover:scale-110" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
