import { Link } from "wouter";
import { useState } from "react";

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="border-b">
        <div className="container mx-auto px-4 py-4">
          <nav className="flex items-center justify-between">
            <Link href="/" className="text-2xl font-bold">
              YSollo
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex gap-4">
              <Link
                href="/offers"
                className="px-4 py-2 text-sm font-medium hover:underline"
              >
                Pricing
              </Link>
              <Link
                href="/learn"
                className="px-4 py-2 text-sm font-medium hover:underline"
              >
                Documentation
              </Link>
              <Link
                href="/contact"
                className="px-4 py-2 text-sm font-medium hover:underline"
              >
                Contact sales
              </Link>
              <Link
                href="/auth/signin"
                className="px-4 py-2 text-sm font-medium hover:underline"
              >
                Sign In
              </Link>
              <Link
                href="/auth/signup"
                className="px-4 py-2 text-sm font-medium bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
              >
                Sign Up
              </Link>
            </div>

            {/* Mobile Hamburger Button */}
            <button
              className="md:hidden p-2"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle menu"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                {mobileMenuOpen ? (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                ) : (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                )}
              </svg>
            </button>
          </nav>

          {/* Mobile Menu */}
          {mobileMenuOpen && (
            <div className="md:hidden mt-4 pb-4 flex flex-col gap-2">
              <Link
                href="/offers"
                className="px-4 py-2 text-sm font-medium hover:bg-accent rounded-md"
                onClick={() => setMobileMenuOpen(false)}
              >
                Pricing
              </Link>
              <Link
                href="/learn"
                className="px-4 py-2 text-sm font-medium hover:bg-accent rounded-md"
                onClick={() => setMobileMenuOpen(false)}
              >
                Documentation
              </Link>
              <Link
                href="/contact"
                className="px-4 py-2 text-sm font-medium hover:bg-accent rounded-md"
                onClick={() => setMobileMenuOpen(false)}
              >
                Contact sales
              </Link>
              <Link
                href="/auth/signin"
                className="px-4 py-2 text-sm font-medium hover:bg-accent rounded-md"
                onClick={() => setMobileMenuOpen(false)}
              >
                Sign In
              </Link>
              <Link
                href="/auth/signup"
                className="px-4 py-2 text-sm font-medium bg-primary text-primary-foreground rounded-md hover:bg-primary/90 text-center"
                onClick={() => setMobileMenuOpen(false)}
              >
                Sign Up
              </Link>
            </div>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1">{children}</main>

      {/* Footer */}
      <footer className="mt-auto border-t">
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
            <div>© {new Date().getFullYear()} YSollo. All rights reserved.</div>
            <ul className="flex flex-wrap justify-center gap-4 md:gap-6">
              <li>
                <Link href="/learn?doc=terms" className="hover:text-foreground">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link
                  href="/learn?doc=privacy"
                  className="hover:text-foreground"
                >
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link
                  href="/learn?doc=cookies"
                  className="hover:text-foreground"
                >
                  Cookie Policy
                </Link>
              </li>
            </ul>
          </div>
        </div>
      </footer>
    </div>
  );
}
