"use client"

import { Suspense } from "react"
import { useQuery } from "@tanstack/react-query"
import { useParams } from "next/navigation"
import { useAuth } from "@/hooks/use-auth"
import { Skeleton } from "@/components/ui/skeleton"
import { formatPrice } from "@/lib/types"
import Link from "next/link"
import Image from "next/image"
import { ChevronRight } from "lucide-react"
import type { AppOrder } from "@/lib/types"

function OrderDetailsInner() {
  const params = useParams()
  const orderId = params.orderId as string

  const { customer, isLoading: authLoading } = useAuth()

  const { data: order, isPending: orderLoading } = useQuery<AppOrder | null>({
    queryKey: ["order", orderId],
    queryFn: async () => {
      const res = await fetch(`/api/orders/${orderId}`)
      if (!res.ok) return null
      return res.json()
    },
    enabled: !!customer && !!orderId,
  })

  if (authLoading || orderLoading) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 space-y-6">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2">
          <Skeleton className="h-3 w-16" />
          <Skeleton className="h-3 w-2" />
          <Skeleton className="h-3 w-20" />
        </div>
        {/* Heading + status */}
        <div className="flex items-center gap-4">
          <Skeleton className="h-9 w-40" />
          <Skeleton className="h-6 w-20 rounded-full" />
        </div>
        {/* Info cards */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div className="rounded-xl border border-border p-5 space-y-2">
            <Skeleton className="h-4 w-28 mb-3" />
            {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-3 w-full" />)}
          </div>
          <div className="rounded-xl border border-border p-5 space-y-2">
            <Skeleton className="h-4 w-28 mb-3" />
            {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-3 w-3/4" />)}
          </div>
        </div>
        {/* Items */}
        <div className="rounded-xl border border-border p-5 space-y-4">
          <Skeleton className="h-4 w-24 mb-2" />
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex gap-3">
              <Skeleton className="h-16 w-16 rounded-lg shrink-0" />
              <div className="flex-1 space-y-1.5">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
                <Skeleton className="h-3 w-1/4" />
              </div>
              <Skeleton className="h-5 w-16 shrink-0" />
            </div>
          ))}
          <div className="border-t pt-3 space-y-2">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex justify-between">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-16" />
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (!order) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 text-center">
        <p className="font-medium">الطلب غير موجود</p>
        <Link href="/account" className="mt-4 inline-block text-sm font-medium hover:underline">
          العودة إلى حسابي
        </Link>
      </div>
    )
  }

  const currencyCode = order.currencyCode ?? "tnd"
  const status = order.status ?? "pending"

  const STATUS_LABELS: Record<string, string> = {
    pending: "قيد الانتظار",
    processing: "قيد المعالجة",
    shipped: "تم الشحن",
    delivered: "تم التسليم",
    cancelled: "ملغي",
    completed: "مكتمل",
  }

  const STATUS_COLORS: Record<string, string> = {
    pending: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
    processing: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
    shipped: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400",
    delivered: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
    completed: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
    cancelled: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
  }

  const shippingAddress = order.shippingAddress as
    | {
        firstName?: string
        lastName?: string
        address?: string
        city?: string
        countryCode?: string
      }
    | null

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <div className="flex items-center gap-2 mb-6 text-sm text-muted-foreground">
        <Link href="/account" className="hover:underline">حسابي</Link>
        <ChevronRight className="w-4 h-4" />
        <span className="font-medium text-foreground">تفاصيل الطلب</span>
      </div>

      <div className="flex items-start justify-between gap-4 mb-10">
        <div>
          <h1 className="text-2xl font-bold">طلب #{order.displayId}</h1>
          <p className="text-sm text-muted-foreground mt-1">
            تاريخ الطلب: {new Date(order.createdAt).toLocaleDateString("ar-TN", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </p>
        </div>
        <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${STATUS_COLORS[status] ?? STATUS_COLORS.pending}`}>
          {STATUS_LABELS[status] ?? status}
        </span>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 mb-10">
        <div className="rounded-xl border border-border p-5">
          <h3 className="text-sm font-semibold mb-3 text-muted-foreground">عنوان الشحن</h3>
          <p className="text-sm leading-relaxed">
            {shippingAddress?.firstName} {shippingAddress?.lastName}<br />
            {shippingAddress?.address}<br />
            {shippingAddress?.city}<br />
            {shippingAddress?.countryCode}
          </p>
        </div>
        <div className="rounded-xl border border-border p-5">
          <h3 className="text-sm font-semibold mb-3 text-muted-foreground">تفاصيل الدفع</h3>
          <p className="text-sm leading-relaxed">
            طريقة الدفع: {order.paymentMethod === "cod" || !order.paymentMethod ? "الدفع عند الاستلام" : order.paymentMethod}<br />
            الحالة: {STATUS_LABELS[status] ?? "قيد المعالجة"}
          </p>
        </div>
      </div>

      <div className="rounded-xl border border-border overflow-hidden">
        <div className="px-5 py-4 border-b border-border bg-muted/50">
          <h3 className="font-semibold">المنتجات</h3>
        </div>
        <div className="divide-y divide-border">
          {order.items?.map((item) => (
            <div key={item.id} className="p-5 flex gap-4">
              <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-muted">
                {item.thumbnail && (
                  <Image src={item.thumbnail} alt={item.title ?? ""} fill className="object-cover" sizes="64px" />
                )}
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">{item.title}</p>
                <p className="text-xs text-muted-foreground mt-0.5">الكمية: {item.quantity}</p>
                <p className="text-sm font-semibold mt-2">{formatPrice(item.unitPrice ?? 0, currencyCode)}</p>
              </div>
            </div>
          ))}
        </div>
        <div className="p-5 bg-muted/30 flex justify-between items-center">
          <span className="text-sm font-medium text-muted-foreground">الإجمالي النهائي</span>
          <span className="text-lg font-bold">{formatPrice(order.total ?? 0, currencyCode)}</span>
        </div>
      </div>
    </div>
  )
}

export default function OrderDetailsPage() {
  return (
    <Suspense fallback={
      <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 space-y-6">
        <Skeleton className="h-10 w-48" />
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <Skeleton className="h-32 w-full rounded-xl" />
          <Skeleton className="h-32 w-full rounded-xl" />
        </div>
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    }>
      <OrderDetailsInner />
    </Suspense>
  )
}
