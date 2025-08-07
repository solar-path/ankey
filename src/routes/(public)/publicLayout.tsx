import { LoginForm } from '@/components/auth/LoginForm'
import { RegisterWorkspaceForm } from '@/components/auth/RegisterWorkspaceForm'
import FindInquiryForm from '@/components/inquiry/findInquiryForm'
import InquiryForm from '@/components/inquiry/inquiryForm'
import { useDrawer } from '@/components/QDrawer/QDrawer.store'
import { Button } from '@/components/ui/button'
import { Link } from '@tanstack/react-router'
import { useEffect } from 'react'

interface PublicLayoutProps {
  children: React.ReactNode
  user?: any // TODO: Define proper user type
  openInquiry?: boolean
  openLogin?: boolean
  openRegister?: boolean
  openFindInquiry?: boolean
}

export default function PublicLayout({
  children,
  user,
  openInquiry,
  openLogin,
  openRegister,
  openFindInquiry,
}: PublicLayoutProps) {
  const { openDrawer } = useDrawer()

  useEffect(() => {
    if (openInquiry) {
      handleContactSales()
    } else if (openLogin) {
      handleSignIn()
    } else if (openRegister) {
      handleSignUp()
    } else if (openFindInquiry) {
      handleFindInquiry()
    }
  }, [openInquiry, openLogin, openRegister, openFindInquiry])

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

  const handleFindInquiry = () => {
    openDrawer(
      <FindInquiryForm
        onSubmit={async data => {
          // TODO: Implement inquiry lookup
          console.log('Find inquiry:', data)
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

          {user ? (
            <div className="flex items-center space-x-2">
              <span className="text-gray-600">Welcome, {user.fullName}</span>
              <Button variant="ghost" onClick={() => console.log('Logout')}>
                Sign Out
              </Button>
            </div>
          ) : (
            <>
              <Button variant="ghost" onClick={handleSignUp}>
                Sign Up
              </Button>
              <Button onClick={handleSignIn}>Sign In</Button>
            </>
          )}
        </div>
      </div>

      {/* MAIN CONTENT */}
      <div className="flex-grow">{children}</div>

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
