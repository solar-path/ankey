import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { useEffect, useState } from 'react'
import { useDrawer } from './QDrawer.store'

export function QDrawer() {
  const [isClient, setIsClient] = useState(false)
  const { state, closeDrawer } = useDrawer()

  // Ensure we're on the client before rendering
  useEffect(() => {
    setIsClient(true)
  }, [])

  if (!isClient) {
    return null
  }

  return (
    <Sheet
      open={state.isOpen}
      onOpenChange={() => {
        // Prevent closing on outside click - drawer is persistent
        // Only close via explicit closeDrawer() calls
      }}
    >
      <SheetContent side="right" className="w-full max-w-sm">
        <SheetHeader>
          <SheetTitle>{state.title}</SheetTitle>
          <SheetDescription>{state.description}</SheetDescription>
        </SheetHeader>
        <div>{state.content || <p>No content provided</p>}</div>
      </SheetContent>
    </Sheet>
  )
}
