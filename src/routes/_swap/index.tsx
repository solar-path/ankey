import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_swap/')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/_swap/"!</div>
}
