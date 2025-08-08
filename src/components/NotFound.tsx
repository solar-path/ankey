import { Button } from '@/components/ui/button'
import { Link, useRouter } from '@tanstack/react-router'

export function NotFound() {
  const router = useRouter()

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="text-center space-y-6">
        <div className="space-y-2">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100">
            404
          </h1>
          <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-300">
            Page Not Found
          </h2>
          <p className="text-gray-600 dark:text-gray-400 max-w-md mx-auto">
            The page you're looking for doesn't exist or has been moved.
          </p>
        </div>
        
        <div className="flex gap-4 justify-center">
          <Button asChild>
            <Link to="/">
              Go Home
            </Link>
          </Button>
          <Button variant="outline" onClick={() => router.history.back()}>
            Go Back
          </Button>
        </div>
      </div>
    </div>
  )
}