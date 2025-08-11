import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/_core/account/')({
  beforeLoad: () => {
    throw redirect({ to: '/account/profile' })
  },
})
