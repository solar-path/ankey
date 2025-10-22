import { Route, Switch, useLocation } from "wouter";
import PublicLayout from "./routes/public.layout";
import HomePage from "./routes/home.page";
import LearnPage from "./routes/learn.page";
import OffersPage from "./modules/pricing/offers.page";
import ContactPage from "./modules/inquiry/contactUs.page";
import NotFoundPage from "./routes/404.page";
import PrivateLayout from "./routes/private.layout";
import { CompanyDashboardPage } from "./modules/company/companyDashboard.page";
import SignInPage from "./modules/auth/signin.page";
import SignUpPage from "./modules/auth/signup.page";
import ForgotPasswordPage from "./modules/auth/forgotPassword.page";
import VerifyAccountPage from "./modules/auth/verifyAccount.page";
import { Toaster } from "sonner";
import { AuthProvider } from "./lib/auth-context";
import { CompanyProvider } from "./lib/company-context";

function App() {
  const [location] = useLocation();

  // Define public and private routes
  const publicRoutes = [
    "/",
    "/learn",
    "/offers",
    "/contact",
    "/auth/signin",
    "/auth/signup",
    "/auth/forgot-password",
    "/auth/verify-account",
  ];

  const privateRoutes = ["/dashboard"];

  // Check if route exists in either public or private routes
  const isKnownRoute = [...publicRoutes, ...privateRoutes].some((route) => {
    if (location === route) return true;
    if (location.startsWith(route + "?")) return true;
    return false;
  });

  // If route is not known, show 404 in public layout
  const isPublicRoute =
    !isKnownRoute ||
    publicRoutes.some((route) => {
      if (location === route) return true;
      if (location.startsWith(route + "?")) return true;
      return false;
    });

  return (
    <AuthProvider>
      <CompanyProvider>
        {isPublicRoute ? (
          <PublicLayout>
            <Switch>
              <Route path="/" component={HomePage} />
              <Route path="/learn" component={LearnPage} />
              <Route path="/offers" component={OffersPage} />
              <Route path="/contact" component={ContactPage} />
              <Route path="/auth/signin" component={SignInPage} />
              <Route path="/auth/signup" component={SignUpPage} />
              <Route
                path="/auth/forgot-password"
                component={ForgotPasswordPage}
              />
              <Route
                path="/auth/verify-account"
                component={VerifyAccountPage}
              />
              <Route component={NotFoundPage} />
            </Switch>
          </PublicLayout>
        ) : (
          <PrivateLayout>
            <Switch>
              <Route path="/dashboard" component={CompanyDashboardPage} />
              <Route component={NotFoundPage} />
            </Switch>
          </PrivateLayout>
        )}

        <Toaster position="top-right" />
      </CompanyProvider>
    </AuthProvider>
  );
}

export default App;
