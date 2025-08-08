import { QDrawer } from '@/components/QDrawer/QDrawer'
import { Toaster } from "@/components/ui/sonner"
import { createRootRoute, Outlet } from '@tanstack/react-router'
import { TanStackRouterDevtools } from '@tanstack/react-router-devtools'



export const Route = createRootRoute({
  component: () => (
    <>
      <QDrawer />
      <Outlet />
      <Toaster />
      <TanStackRouterDevtools />
    </>
  ),
})
