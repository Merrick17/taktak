"use client"

import { useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-6 px-4 text-center">
      <div className="space-y-2">
        <p className="text-4xl font-bold">٥٠٠</p>
        <p className="text-lg font-medium">حدث خطأ غير متوقع</p>
        <p className="text-sm text-muted-foreground">نعتذر عن هذا الخطأ. يرجى المحاولة مجددًا.</p>
      </div>
      <div className="flex items-center gap-3">
        <Button onClick={reset}>حاول مجددًا</Button>
        <Button variant="outline" asChild>
          <Link href="/">العودة للرئيسية</Link>
        </Button>
      </div>
    </div>
  )
}
