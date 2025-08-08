import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/_public/learn/privacy')({
  beforeLoad: () => {
    // Redirect to main learn page with privacy document
    throw redirect({
      to: '/learn',
      search: { doc: 'privacy' },
    })
  },
})
