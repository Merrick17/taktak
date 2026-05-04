"use client"

import { useState } from "react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { ToastProvider } from "@/hooks/use-toast"
import { InstantCheckoutHost } from "@/components/blocks/commerce/instant-checkout-host"
import type { ReactNode } from "react"

export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: { staleTime: 60 * 1000, retry: 1 },
        },
      })
  )

  return (
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        {children}
        <InstantCheckoutHost />
      </ToastProvider>
    </QueryClientProvider>
  )
}
