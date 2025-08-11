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
          <Link to="/edu" className="[&.active]:font-bold hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
            Education
          </Link>
          <Link to="/hunt" className="[&.active]:font-bold hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">
            Job Hunt
          </Link>
          <Link to="/shop" className="[&.active]:font-bold hover:text-orange-600 dark:hover:text-orange-400 transition-colors">
            Shop
          </Link>
          <Link to="/swap" className="[&.active]:font-bold hover:text-purple-600 dark:hover:text-purple-400 transition-colors">
            Crypto Swap
          </Link>
          <Link to="/learn" search={{ doc: undefined }} className="[&.active]:font-bold hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
            Learn & Support
          </Link>
          <Link to="/offers" className="[&.active]:font-bold hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
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
