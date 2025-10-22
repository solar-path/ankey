import { Link } from "wouter";
import { Button } from "@/lib/ui/button";

export default function HomePage() {
  return (
    <div className="container mx-auto px-4">
      {/* Hero Section */}
      <section className="py-20 text-center">
        <h1 className="text-5xl font-bold mb-6">
          Welcome to YSollo
        </h1>
        <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
          The ultimate multi-tenant platform with schema-per-tenant and subdomain isolation.
          Secure, scalable, and simple to use.
        </p>
        <div className="flex gap-4 justify-center">
          <Link href="/auth/signup">
            <Button size="lg">Get Started</Button>
          </Link>
          <Link href="/about">
            <Button size="lg" variant="outline">Learn More</Button>
          </Link>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20">
        <h2 className="text-3xl font-bold text-center mb-12">Features</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="p-6 border rounded-lg">
            <h3 className="text-xl font-semibold mb-3">Multi-Tenancy</h3>
            <p className="text-muted-foreground">
              Complete data isolation with schema-per-tenant architecture for maximum security.
            </p>
          </div>
          <div className="p-6 border rounded-lg">
            <h3 className="text-xl font-semibold mb-3">Subdomain Support</h3>
            <p className="text-muted-foreground">
              Each tenant gets their own subdomain with wildcard DNS support.
            </p>
          </div>
          <div className="p-6 border rounded-lg">
            <h3 className="text-xl font-semibold mb-3">Customizable</h3>
            <p className="text-muted-foreground">
              Configure language, timezone, currency, and more for each tenant.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
