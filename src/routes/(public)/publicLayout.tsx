import { useDrawer } from '@/components/QDrawer/QDrawer.store'
import { Button } from '@/components/ui/button'
import { Link } from '@tanstack/react-router'

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  const { openDrawer } = useDrawer()

  // TODO: These components need to be implemented
  const handleSignUp = () => {
    console.warn('RegisterForm component not yet implemented')
  }

  const handleSignIn = () => {
    console.warn('LoginForm component not yet implemented')
  }

  const handleContactSales = () => {
    console.warn('InquiryForm component not yet implemented')
  }

  return (
    <div className="flex min-h-screen flex-col">
      {/* HEADER SECTION */}
      <div className="flex items-center justify-between p-4">
        <div className="flex items-center space-x-4">
          <h1 className="text-xl font-bold">
            <Link to="/">Ankey</Link>
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
          <Button variant="ghost" onClick={handleSignUp}>
            Sign Up
          </Button>
          <Button onClick={handleSignIn}>Sign In</Button>
        </div>
      </div>

      {/* MAIN CONTENT */}
      <div className="flex-grow">{children}</div>

      {/* FOOTER SECTION  */}
      <footer className="flex items-center pt-6 pr-12 pb-6 pl-12 text-sm">
        <p className="flex-1">© 2024 Ankey. All rights reserved.</p>
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
