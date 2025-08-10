
import { createFileRoute } from '@tanstack/react-router'
export const Route = createFileRoute('/_core/pricing-admin')({
  component: RouteComponent,
})

function RouteComponent() {


  return (
    <div>
      <h1>Pricing Admin</h1>
      <p>This is the admin page for managing pricing plans and subscriptions.</p>
    </div>
  )
}
