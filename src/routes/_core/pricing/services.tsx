import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_core/pricing/services')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/_core/pricing/services"!</div>
}
