import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_public/terms')({
  component: Terms,
})

function Terms() {
  return <>Terms</>
}
