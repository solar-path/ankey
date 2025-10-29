import { Link } from "wouter";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Globe } from "lucide-react";
import { SUPPORTED_LANGUAGES, type SupportedLanguage } from "@/lib/i18n";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/lib/ui/dropdown-menu";
import { Button } from "@/lib/ui/button";

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { t, i18n } = useTranslation();

  const changeLanguage = (lng: SupportedLanguage) => {
    i18n.changeLanguage(lng);
  };

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
            <div className="hidden md:flex gap-4 items-center">
              <Link
                href="/offers"
                className="px-4 py-2 text-sm font-medium hover:underline"
              >
                {t('common.pricing')}
              </Link>
              <Link
                href="/learn"
                className="px-4 py-2 text-sm font-medium hover:underline"
              >
                {t('common.learn')}
              </Link>
              <Link
                href="/contact"
                className="px-4 py-2 text-sm font-medium hover:underline"
              >
                {t('common.contact')}
              </Link>
              <Link
                href="/auth/signin"
                className="px-4 py-2 text-sm font-medium hover:underline"
              >
                {t('common.signIn')}
              </Link>
              <Link
                href="/auth/signup"
                className="px-4 py-2 text-sm font-medium bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
              >
                {t('common.signUp')}
              </Link>

              {/* Language Switcher */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" title={t('common.language')}>
                    <Globe className="h-5 w-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {Object.entries(SUPPORTED_LANGUAGES).map(([code, name]) => (
                    <DropdownMenuItem
                      key={code}
                      onClick={() => changeLanguage(code as SupportedLanguage)}
                      className={i18n.language === code ? 'bg-accent' : ''}
                    >
                      {name}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
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
                {t('common.pricing')}
              </Link>
              <Link
                href="/learn"
                className="px-4 py-2 text-sm font-medium hover:bg-accent rounded-md"
                onClick={() => setMobileMenuOpen(false)}
              >
                {t('common.learn')}
              </Link>
              <Link
                href="/contact"
                className="px-4 py-2 text-sm font-medium hover:bg-accent rounded-md"
                onClick={() => setMobileMenuOpen(false)}
              >
                {t('common.contact')}
              </Link>
              <Link
                href="/auth/signin"
                className="px-4 py-2 text-sm font-medium hover:bg-accent rounded-md"
                onClick={() => setMobileMenuOpen(false)}
              >
                {t('common.signIn')}
              </Link>
              <Link
                href="/auth/signup"
                className="px-4 py-2 text-sm font-medium bg-primary text-primary-foreground rounded-md hover:bg-primary/90 text-center"
                onClick={() => setMobileMenuOpen(false)}
              >
                {t('common.signUp')}
              </Link>

              {/* Mobile Language Switcher */}
              <div className="border-t pt-2 mt-2">
                <div className="px-4 py-2 text-xs font-medium text-muted-foreground">
                  {t('common.language')}
                </div>
                {Object.entries(SUPPORTED_LANGUAGES).map(([code, name]) => (
                  <button
                    key={code}
                    onClick={() => {
                      changeLanguage(code as SupportedLanguage);
                      setMobileMenuOpen(false);
                    }}
                    className={`w-full text-left px-4 py-2 text-sm font-medium hover:bg-accent rounded-md ${
                      i18n.language === code ? 'bg-accent' : ''
                    }`}
                  >
                    {name}
                  </button>
                ))}
              </div>
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
            <div>{t('footer.copyright', { year: new Date().getFullYear() })}</div>
            <ul className="flex flex-wrap justify-center gap-4 md:gap-6">
              <li>
                <Link href="/learn?doc=terms" className="hover:text-foreground">
                  {t('footer.terms')}
                </Link>
              </li>
              <li>
                <Link
                  href="/learn?doc=privacy"
                  className="hover:text-foreground"
                >
                  {t('footer.privacy')}
                </Link>
              </li>
              <li>
                <Link
                  href="/learn?doc=cookies"
                  className="hover:text-foreground"
                >
                  {t('footer.cookies')}
                </Link>
              </li>
            </ul>
          </div>
        </div>
      </footer>
    </div>
  );
}
