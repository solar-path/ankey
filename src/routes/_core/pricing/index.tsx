import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/_core/pricing/')({
  beforeLoad: () => {
    throw redirect({ to: '/pricing/plans' })
  },
})