import { useDrawer } from '@/components/QDrawer.store'
import { Button } from '@/components/ui/button'
import InquiryForm from '@/pages/(public)/inquiry/inquiryForm'
import ForgotPasswordForm from '@/pages/auth/forgotPasswordForm'
import LoginForm from '@/pages/auth/loginForm'
import RegisterForm from '@/pages/auth/registerForm'
import { type PublicPageProps } from '@/types'
import { Link, usePage } from '@inertiajs/react'
import { useEffect } from 'react'

// Using PublicPageProps from centralized types folder

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  // Call the hook at the top level of your component
  const { openDrawer } = useDrawer()
  const { props } = usePage<PublicPageProps>()
  const { openLoginDrawer, openRegisterDrawer, openForgotPasswordDrawer } = props
  const user = props.auth?.user

  // Open login drawer if openLoginDrawer flag from session is true
  useEffect(() => {
    if (openLoginDrawer) {
      openDrawer(<LoginForm canResetPassword={true} />)
    }
  }, [openLoginDrawer, openDrawer])

  // Open register drawer if openRegisterDrawer flag from session is true
  useEffect(() => {
    if (openRegisterDrawer) {
      openDrawer(<RegisterForm />)
    }
  }, [openRegisterDrawer, openDrawer])

  // Open forgot password drawer if openForgotPasswordDrawer flag from session is true
  useEffect(() => {
    if (openForgotPasswordDrawer) {
      openDrawer(<ForgotPasswordForm />)
    }
  }, [openForgotPasswordDrawer, openDrawer])
  return (
    <div className="flex min-h-screen flex-col">
      {/* HEADER SECTION */}
      <div className="flex items-center justify-between p-4">
        <div className="flex items-center space-x-4">
          <h1 className="text-xl font-bold">
            <Link href="/">Solo</Link>
          </h1>
        </div>
        <div className="flex items-center space-x-4 text-sm">
          <Link href="/learn" className="[&[aria-current=page]]:font-bold">
            Learn and support
          </Link>
          <Link href="/pricing" className="[&[aria-current=page]]:font-bold">
            Pricing
          </Link>

          {user ? (
            <Button variant="ghost" asChild>
              <Link href="/dashboard">Dashboard</Link>
            </Button>
          ) : (
            <>
              <Button variant="ghost" onClick={() => openDrawer(<RegisterForm />)}>
                Sign Up
              </Button>
              <Button onClick={() => openDrawer(<LoginForm canResetPassword={true} />)}>
                Sign In
              </Button>
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
          <Button variant="ghost" size="sm">
            <Link href="/cookies" className="[&[aria-current=page]]:font-bold">
              Cookies
            </Link>
          </Button>
          <Button variant="ghost" size="sm">
            <Link href="/terms" className="[&[aria-current=page]]:font-bold">
              Terms of Service
            </Link>
          </Button>
          <Button variant="ghost" size="sm">
            <Link href="/privacy" className="[&[aria-current=page]]:font-bold">
              Privacy Policy
            </Link>
          </Button>
          <Button variant="ghost" size="sm" onClick={() => openDrawer(<InquiryForm />)}>
            Contact sales
          </Button>
        </div>
      </footer>
    </div>
  )
}
