import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/_public/learn/cookies')({
  beforeLoad: () => {
    // Redirect to main learn page with cookies document
    throw redirect({
      to: '/learn',
      search: { doc: 'cookies' },
    })
  },
})
