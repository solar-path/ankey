import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_edu/')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/_edu/"!</div>
}
