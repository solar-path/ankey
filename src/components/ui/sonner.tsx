import { Toaster as Sonner, type ToasterProps } from 'sonner'

const Toaster = ({ ...props }: ToasterProps) => {
  // Since we're not using next-themes in this project, default to light theme
  const theme = 'light'

  return (
    <Sonner
      theme={theme as ToasterProps['theme']}
      className="toaster group"
      position="top-center"
      toastOptions={{
        style: {
          zIndex: 100, // Higher than sheet components (z-50)
        },
        duration: 5000, // Auto-close after 5 seconds
      }}
      style={
        {
          '--normal-bg': 'var(--popover)',
          '--normal-text': 'var(--popover-foreground)',
          '--normal-border': 'var(--border)',
          zIndex: 100,
        } as React.CSSProperties
      }
      {...props}
    />
  )
}

export { Toaster }
