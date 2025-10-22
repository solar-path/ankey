import { useLocation, Link } from "wouter";
import { useAuth } from "@/lib/auth-context";
import { useBreadcrumb, BreadcrumbProvider } from "@/lib/breadcrumb-context";
import { useCompanyOptional } from "@/lib/company-context";
import { useEffect } from "react";
import { AppSidebar } from "@/lib/ui/app-sidebar";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/lib/ui/breadcrumb";
import { Separator } from "@/lib/ui/separator";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/lib/ui/sidebar";

function PrivateLayoutContent({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const { extraCrumbs } = useBreadcrumb();
  const companyContext = useCompanyOptional();
  const [location] = useLocation();

  // Get organization name from active company in context
  const orgName = companyContext?.activeCompany?.title || "YSollo";

  // Generate breadcrumbs from current path
  const generateBreadcrumbs = () => {
    const paths = location.split("/").filter(Boolean);
    const breadcrumbs: { href?: string; label: string }[] = [];

    // Add organization as first breadcrumb (clickable - redirects to dashboard)
    breadcrumbs.push({ href: "/dashboard", label: orgName });

    // Parse the current route to determine the page type
    const isOrgchartRoute = paths.includes("orgchart");
    const isDoaRoute = paths.includes("doa");
    const isDashboardRoute = paths.includes("dashboard");

    // Add page-specific breadcrumb based on route
    if (isOrgchartRoute) {
      breadcrumbs.push({
        href: `/orgchart`,
        label: "Orgchart",
      });
    } else if (isDoaRoute) {
      breadcrumbs.push({
        href: `/doa`,
        label: "DOA",
      });

      // Check for subpages - only add "New rule" if it's the new matrix page
      const doaIndex = paths.indexOf("doa");
      const afterDoaPath = paths.slice(doaIndex + 1);

      const isNewMatrix = afterDoaPath.includes("new");

      if (isNewMatrix) {
        breadcrumbs.push({
          label: "New rule",
        });
      }
    } else if (!isDashboardRoute) {
      // For other routes, add the current page
      const lastPath = paths[paths.length - 1];
      // Skip UUIDs
      if (
        lastPath &&
        !lastPath.match(
          /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
        )
      ) {
        const label =
          lastPath.charAt(0).toUpperCase() +
          lastPath.slice(1).replace(/-/g, " ");
        breadcrumbs.push({ href: location, label });
      }
    }

    // Add extra breadcrumbs from pages (e.g., orgchart version)
    extraCrumbs.forEach((crumb) => {
      breadcrumbs.push(crumb);
    });

    return breadcrumbs;
  };

  const breadcrumbs = generateBreadcrumbs();

  return (
    <SidebarProvider>
      <AppSidebar
        user={{
          name: user!.fullname,
          email: user!.email,
          avatar: user!.avatar || user!.profile?.avatar,
        }}
        organization={{
          name: orgName,
          plan: "Enterprise",
        }}
      />
      <SidebarInset>
        <header className="flex h-12 shrink-0 items-center gap-2 px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <Breadcrumb>
            <BreadcrumbList>
              {breadcrumbs.map((crumb, index) => (
                <div key={`${crumb.href}-${index}`} className="contents">
                  {index > 0 && <BreadcrumbSeparator />}
                  <BreadcrumbItem>
                    {index === breadcrumbs.length - 1 || !crumb.href ? (
                      <BreadcrumbPage>{crumb.label}</BreadcrumbPage>
                    ) : (
                      <BreadcrumbLink asChild>
                        <Link href={crumb.href}>{crumb.label}</Link>
                      </BreadcrumbLink>
                    )}
                  </BreadcrumbItem>
                </div>
              ))}
            </BreadcrumbList>
          </Breadcrumb>
        </header>
        <main className="flex flex-1 flex-col gap-4 p-4 bg-stone-50">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}

export default function PrivateLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isAuthenticated, isLoading } = useAuth();
  const [, setLocation] = useLocation();

  // Redirect to sign in if not authenticated (after loading completes)
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      setLocation("/auth/signin");
    }
  }, [isLoading, isAuthenticated, setLocation]);

  // Show loading state while checking authentication
  if (isLoading) {
    return null;
  }

  // Don't render anything if not authenticated
  if (!isAuthenticated || !user) {
    return null;
  }

  return (
    <BreadcrumbProvider>
      <PrivateLayoutContent>{children}</PrivateLayoutContent>
    </BreadcrumbProvider>
  );
}
