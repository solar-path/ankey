import { NotFound } from '@/components/NotFound'
import { QDrawer } from '@/components/QDrawer/QDrawer'
import { Toaster } from '@/components/ui/sonner'
import { useTheme } from '@/hooks/useTheme'
import { createRootRoute, Outlet } from '@tanstack/react-router'

function RootComponent() {
  // Initialize theme system - this will load and apply user's saved theme
  useTheme()

  return (
    <>
      <Toaster />
      <QDrawer />
      <Outlet />
    </>
  )
}

export const Route = createRootRoute({
  component: RootComponent,
  notFoundComponent: NotFound,
})
