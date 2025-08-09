import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/_core/settings/')({
  beforeLoad: () => {
    throw redirect({ to: '/settings/profile' })
  },
})
