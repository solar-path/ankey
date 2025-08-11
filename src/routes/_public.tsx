import { LoginForm } from '@/components/auth/LoginForm'
import InquiryForm from '@/components/inquiry/inquiryForm'
import { useDrawer } from '@/components/QDrawer/QDrawer.store'
import { Button } from '@/components/ui/button'
import { createFileRoute, Link, Outlet } from '@tanstack/react-router'

export const Route = createFileRoute('/_public')({
  component: PublicLayout,
})

function PublicLayout() {
  const { openDrawer } = useDrawer()

  return (
    <div className="flex min-h-screen flex-col">
      {/* HEADER SECTION */}
      <div className="flex items-center justify-between pt-6 pr-12 pb-6 pl-12">
        <div className="flex items-center space-x-4">
          <h1 className="text-xl font-bold">
            <Link to="/">Solo</Link>
          </h1>
        </div>
        <div className="flex items-center space-x-4 text-sm">
          <Link to="/learn" search={{ doc: undefined }} className="[&.active]:font-bold">
            Learn and support
          </Link>
          <Link to="/offers" className="[&.active]:font-bold">
            Pricing
          </Link>


            <Button onClick={() => openDrawer(<LoginForm />)}>Sign In</Button>
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
            <Link to="/learn" search={{ doc: 'cookies' }} className="[&.active]:font-bold">
              Cookies
            </Link>
          </Button>
          <Button variant="ghost" size="sm" asChild>
            <Link to="/learn" search={{ doc: 'terms' }} className="[&.active]:font-bold">
              Terms of Service
            </Link>
          </Button>
          <Button variant="ghost" size="sm" asChild>
            <Link to="/learn" search={{ doc: 'privacy' }} className="[&.active]:font-bold">
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
