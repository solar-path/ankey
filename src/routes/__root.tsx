import { NotFound } from '@/components/NotFound'
import { QDrawer } from '@/components/QDrawer/QDrawer'
import { Toaster } from '@/components/ui/sonner'
import { createRootRoute, Outlet } from '@tanstack/react-router'

export const Route = createRootRoute({
  component: () => (
    <>
      <Toaster />

      <QDrawer />
      <Outlet />
    </>
  ),
  notFoundComponent: NotFound,
})
