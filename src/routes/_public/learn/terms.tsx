import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/_public/learn/terms')({
  beforeLoad: () => {
    // Redirect to main learn page with terms document
    throw redirect({
      to: '/learn',
      search: { doc: 'terms' },
    })
  },
})
