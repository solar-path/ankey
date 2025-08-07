import { LoginForm } from '@/components/auth/LoginForm'
import { RegisterWorkspaceForm } from '@/components/auth/RegisterWorkspaceForm'
import InquiryForm from '@/components/inquiry/inquiryForm'
import { useDrawer } from '@/components/QDrawer/QDrawer.store'
import { Button } from '@/components/ui/button'
import { createFileRoute, Link, Outlet } from '@tanstack/react-router'

export const Route = createFileRoute('/_public')({
  component: PublicLayout,
})

function PublicLayout() {
  const { openDrawer } = useDrawer()

  const handleSignUp = () => {
    openDrawer(
      <RegisterWorkspaceForm
        onSubmit={async data => {
          // TODO: Implement registration logic
          console.log('Register:', data)
        }}
      />
    )
  }

  const handleSignIn = () => {
    openDrawer(
      <LoginForm
        onSubmit={async data => {
          // TODO: Implement login logic
          console.log('Login:', data)
        }}
      />
    )
  }

  const handleContactSales = () => {
    openDrawer(
      <InquiryForm
        onSubmit={async data => {
          // TODO: Implement inquiry submission
          console.log('Inquiry:', data)
        }}
      />
    )
  }

  return (
    <div className="flex min-h-screen flex-col">
      {/* HEADER SECTION */}
      <div className="flex items-center justify-between pt-6 pr-12 pb-6 pl-12">
        <div className="flex items-center space-x-4">
          <h1 className="text-xl font-bold">
            <Link to="/">Aneko, llc</Link>
          </h1>
        </div>
        <div className="flex items-center space-x-4 text-sm">
          <Link to="/learn" className="[&.active]:font-bold">
            Learn and support
          </Link>
          <Link to="/pricing" className="[&.active]:font-bold">
            Pricing
          </Link>

          {/* TODO: Add authentication state management */}
          <>
            <Button variant="ghost" onClick={handleSignUp}>
              Sign Up
            </Button>
            <Button onClick={handleSignIn}>Sign In</Button>
          </>
        </div>
      </div>

      {/* MAIN CONTENT */}
      <div className="flex-grow">
        <Outlet />
      </div>

      {/* FOOTER SECTION  */}
      <footer className="flex items-center pt-6 pr-12 pb-6 pl-12 text-sm">
        <p className="flex-1">© 2024 Aneko, llc. All rights reserved.</p>
        <div className="flex items-center space-x-4">
          <Button variant="ghost" size="sm" asChild>
            <Link to="/cookies" className="[&.active]:font-bold">
              Cookies
            </Link>
          </Button>
          <Button variant="ghost" size="sm" asChild>
            <Link to="/terms" className="[&.active]:font-bold">
              Terms of Service
            </Link>
          </Button>
          <Button variant="ghost" size="sm" asChild>
            <Link to="/privacy" className="[&.active]:font-bold">
              Privacy Policy
            </Link>
          </Button>
          <Button variant="ghost" size="sm" onClick={handleContactSales}>
            Contact sales
          </Button>
        </div>
      </footer>
    </div>
  )
}