import { createRootRoute, Outlet } from '@tanstack/react-router'
import { TanStackRouterDevtools } from '@tanstack/react-router-devtools'
import { QDrawer } from '@/components/QDrawer/QDrawer'


export const Route = createRootRoute({
  component: () => (
    <>
      <QDrawer />
      <Outlet />
      <TanStackRouterDevtools />
    </>
  ),
})
