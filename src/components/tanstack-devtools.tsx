import type { ReactNode } from 'react'

export function TanStackDevtools({
  children,
}: {
  children: ReactNode
  position?: string
}) {
  if (process.env.NODE_ENV === 'production') return null
  return <>{children}</>
}
