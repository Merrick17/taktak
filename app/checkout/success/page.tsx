"use client"

import { Suspense } from "react"
import { useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import Link from "next/link"
import { CheckCircle2 } from "lucide-react"

function SuccessContent() {
  const searchParams = useSearchParams()
  const orderDisplay = searchParams.get("order")
  const orderId = searchParams.get("oid")

  return (
    <div className="mx-auto max-w-2xl px-4 py-20 text-center space-y-8">
      <div className="flex justify-center">
        <div className="rounded-full bg-green-100 dark:bg-green-900/30 p-4">
          <CheckCircle2 className="w-16 h-16 text-green-600 dark:text-green-400" />
        </div>
      </div>

      <div className="space-y-4">
        <h1 className="text-3xl font-bold tracking-tight">شكراً لك على تسوقك!</h1>
        <p className="text-muted-foreground text-lg max-w-md mx-auto">
          تم استلام طلبك بنجاح. سنرسل لك تأكيداً عبر البريد الإلكتروني قريباً.
        </p>
      </div>

      {orderDisplay && (
        <div className="rounded-xl border border-border bg-muted/30 p-6 inline-block min-w-[300px]">
          <p className="text-sm text-muted-foreground mb-1">رقم الطلب</p>
          <p className="text-xl font-bold">#{orderDisplay}</p>
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
        {orderId ? (
          <Button asChild size="lg" className="px-8">
            <Link href={`/account/orders/${orderId}`}>تتبع طلبي</Link>
          </Button>
        ) : null}
        <Button asChild variant={orderId ? "outline" : "default"} size="lg" className="px-8">
          <Link href="/products">العودة للتسوق</Link>
        </Button>
      </div>
    </div>
  )
}

export default function SuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-2xl px-4 py-20 text-center space-y-8">
          <Skeleton className="h-24 w-24 rounded-full mx-auto" />
          <div className="space-y-3">
            <Skeleton className="h-9 w-3/4 mx-auto" />
            <Skeleton className="h-5 w-2/3 mx-auto" />
            <Skeleton className="h-4 w-1/2 mx-auto" />
          </div>
          <Skeleton className="h-24 w-full max-w-xs mx-auto rounded-xl" />
          <div className="flex justify-center gap-3">
            <Skeleton className="h-11 w-32 rounded-lg" />
            <Skeleton className="h-11 w-32 rounded-lg" />
          </div>
        </div>
      }
    >
      <SuccessContent />
    </Suspense>
  )
}
