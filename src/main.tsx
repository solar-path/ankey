import { RouterProvider, createRouter } from '@tanstack/react-router'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { StrictMode } from 'react'
import ReactDOM from 'react-dom/client'
import './index.css'
// Import the generated route tree
import { routeTree } from './routeTree.gen'
// Polyfill Buffer for browser environment
import { Buffer } from 'buffer'

// Make Buffer available globally
if (typeof window !== 'undefined') {
  ;(window as any).Buffer = Buffer
}

// Create a new router instance
const router = createRouter({ routeTree })

// Create a client for React Query
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
})

// Register the router instance for type safety
declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}

// Render the app
const rootElement = document.getElementById('root')!
if (!rootElement.innerHTML) {
  const root = ReactDOM.createRoot(rootElement)
  root.render(
    <StrictMode>
      <QueryClientProvider client={queryClient}>
        <RouterProvider router={router} />
      </QueryClientProvider>
    </StrictMode>
  )
}
