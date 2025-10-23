import { useLocation } from "wouter";
import { Button } from "@/lib/ui/button";
import { useAuth } from "@/lib/auth-context";

export default function NotFoundPage() {
  const [, setLocation] = useLocation();
  const { isAuthenticated } = useAuth();

  return (
    <div className="container mx-auto px-4 py-20 flex flex-col items-center justify-center min-h-[60vh]">
      <div className="text-center space-y-6">
        <h1 className="text-9xl font-bold text-primary">404</h1>
        <h2 className="text-3xl font-semibold">Page Not Found</h2>
        <p className="text-muted-foreground max-w-md">
          The page you're looking for doesn't exist or has been moved.
        </p>
        {!isAuthenticated && (
          <div className="flex gap-4 justify-center pt-4">
            <Button onClick={() => setLocation("/")}>Go Home</Button>
            <Button variant="outline" onClick={() => setLocation("/auth/signin")}>
              Sign In
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
