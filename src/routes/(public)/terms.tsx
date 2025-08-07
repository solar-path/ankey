import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/(public)/terms')({
  component: Terms,
})

function Terms() {
  return <>Terms</>
}
