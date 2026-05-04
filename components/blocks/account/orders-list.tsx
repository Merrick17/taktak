import Image from "next/image"
import Link from "next/link"
import { Skeleton } from "@/components/ui/skeleton"
import { formatPrice } from "@/lib/types"
import type { AppOrder } from "@/lib/types"

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

function OrderCard({ order }: { order: AppOrder }) {
  const date = new Date(order.createdAt).toLocaleDateString("ar-SA", {
    year: "numeric",
    month: "long",
    day: "numeric",
  })
  const status = order.status ?? "pending"
  const currencyCode = order.currencyCode ?? "tnd"

  return (
    <Link href={`/account/orders/${order.id}`} className="rounded-xl border border-border p-5 hover:bg-muted/50 transition-colors">
      <div className="flex items-start justify-between gap-4 mb-4">
        <div>
          <p className="font-semibold">#{order.displayId}</p>
          <p className="text-sm text-muted-foreground mt-0.5">{date}</p>
        </div>
        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${STATUS_COLORS[status] ?? STATUS_COLORS.pending}`}>
          {STATUS_LABELS[status] ?? status}
        </span>
      </div>

      <div className="flex gap-2 mb-4">
        {order.items?.slice(0, 4).map((item) => (
          <div key={item.id} className="relative h-14 w-12 shrink-0 overflow-hidden rounded-lg bg-muted">
            {item.thumbnail && (
              <Image src={item.thumbnail} alt={item.title ?? ""} fill className="object-cover" sizes="48px" />
            )}
          </div>
        ))}
        {(order.items?.length ?? 0) > 4 && (
          <div className="flex h-14 w-12 items-center justify-center rounded-lg bg-muted text-xs font-medium text-muted-foreground">
            +{order.items!.length - 4}
          </div>
        )}
      </div>

      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">
          {order.items?.length ?? 0} {(order.items?.length ?? 0) === 1 ? "منتج" : "منتجات"}
        </span>
        <span className="font-semibold">{formatPrice(order.total ?? 0, currencyCode)}</span>
      </div>
    </Link>
  )
}

interface OrdersListProps {
  orders: AppOrder[]
  isLoading?: boolean
}

export function OrdersList({ orders, isLoading }: OrdersListProps) {
  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(2)].map((_, i) => (
          <div key={i} className="rounded-xl border border-border p-5 space-y-3">
            <div className="flex items-start justify-between">
              <div className="space-y-1.5">
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-3 w-20" />
              </div>
              <Skeleton className="h-6 w-20 rounded-full" />
            </div>
            <div className="flex gap-2">
              {[...Array(4)].map((_, j) => <Skeleton key={j} className="h-14 w-12 rounded-lg" />)}
            </div>
            <div className="flex items-center justify-between">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-4 w-16" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (orders.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <p className="font-medium">لا توجد طلبات بعد</p>
        <p className="text-sm text-muted-foreground mt-2">ستظهر طلباتك هنا بعد أول عملية شراء.</p>
        <Link href="/products" className="mt-4 text-sm font-medium hover:underline">ابدأ التسوق</Link>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {orders.map((order) => <OrderCard key={order.id} order={order} />)}
    </div>
  )
}
