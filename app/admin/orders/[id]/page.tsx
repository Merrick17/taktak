"use client"

import { use, useMemo } from "react"
import Link from "next/link"
import Image from "next/image"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useToast } from "@/hooks/use-toast"
import { AdminFormLayout } from "@/components/admin/admin-form-layout"
import { formatCurrency } from "@/lib/format-currency"
import { ArrowRight, Package as PackageIcon, User, CreditCard, MapPin, Truck, CheckCircle2, Clock, XCircle, Loader2 } from "lucide-react"

const STATUS_LABELS: Record<string, string> = {
  pending: "قيد الانتظار",
  processing: "قيد المعالجة",
  shipped: "تم الشحن",
  delivered: "تم التسليم",
  cancelled: "ملغي",
  completed: "مكتمل",
}

const STATUS_OPTIONS = ["pending", "processing", "shipped", "delivered", "cancelled", "completed"] as const

const STATUS_ICONS: Record<string, React.ElementType> = {
  pending: Clock,
  processing: Loader2,
  shipped: Truck,
  delivered: CheckCircle2,
  cancelled: XCircle,
  completed: CheckCircle2,
}

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800 border-yellow-200",
  processing: "bg-blue-100 text-blue-800 border-blue-200",
  shipped: "bg-indigo-100 text-indigo-800 border-indigo-200",
  delivered: "bg-green-100 text-green-800 border-green-200",
  cancelled: "bg-red-100 text-red-800 border-red-200",
  completed: "bg-green-100 text-green-800 border-green-200",
}

interface OrderItem {
  id: string
  productId: string
  title: string
  quantity: number
  unitPrice: number
  thumbnail?: string | null
}

interface OrderUser {
  id: string
  email: string
  firstName: string | null
  lastName: string | null
}

interface OrderData {
  id: string
  displayId: string
  total: number
  currencyCode: string
  status: string
  paymentMethod?: string | null
  shippingAddress?: Record<string, unknown> | null
  createdAt: string
  updatedAt: string
  user?: OrderUser | null
  items: OrderItem[]
  subtotal?: number
  discountAmount?: number
  promoCode?: string | null
  shippingFee?: number
}

export default function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const queryClient = useQueryClient()
  const { toast } = useToast()

  const { data: order, isPending, error } = useQuery<OrderData>({
    queryKey: ["admin-order", id],
    queryFn: async () => {
      const res = await fetch(`/api/orders/${id}`, { credentials: "include" })
      if (!res.ok) throw new Error("Failed to fetch order")
      return res.json()
    },
  })

  const updateStatusMutation = useMutation({
    mutationFn: async (status: string) => {
      const res = await fetch(`/api/orders/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ status }),
      })
      if (!res.ok) throw new Error("Failed to update status")
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-order", id] })
      queryClient.invalidateQueries({ queryKey: ["admin-orders"] })
      toast({ title: "تم التحديث", description: "تم تحديث حالة الطلب بنجاح." })
    },
    onError: () => toast({ variant: "destructive", title: "خطأ", description: "فشل تحديث حالة الطلب." }),
  })

  const customerName = useMemo(() => {
    if (!order?.user) return "—"
    const { firstName, lastName, email } = order.user
    if (firstName || lastName) return `${firstName ?? ""} ${lastName ?? ""}`.trim()
    return email
  }, [order?.user])

  const shipping = order?.shippingAddress as Record<string, string> | null

  if (isPending) {
    return (
      <AdminFormLayout title="تفاصيل الطلب" backHref="/admin/orders" backLabel="الطلبات">
        <div className="space-y-6">
          <Skeleton className="h-40 w-full" />
          <Skeleton className="h-60 w-full" />
          <Skeleton className="h-40 w-full" />
        </div>
      </AdminFormLayout>
    )
  }

  if (error || !order) {
    return (
      <AdminFormLayout title="تفاصيل الطلب" backHref="/admin/orders" backLabel="الطلبات">
        <div className="flex flex-col items-center justify-center py-24 gap-2">
          <p className="text-destructive font-medium">لم يتم العثور على الطلب</p>
          <p className="text-sm text-muted-foreground">{error?.message ?? "حدث خطأ أثناء تحميل الطلب."}</p>
        </div>
      </AdminFormLayout>
    )
  }

  return (
    <AdminFormLayout
      title={`طلب #${order.displayId}`}
      backHref="/admin/orders"
      backLabel="الطلبات"
    >
      <div className="space-y-6">

        {/* Status + Actions */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-base">حالة الطلب</CardTitle>
            <Badge className={`${STATUS_COLORS[order.status] ?? "bg-gray-100 text-gray-800 border-gray-200"} border text-sm px-3 py-1`}>
              {STATUS_LABELS[order.status] ?? order.status}
            </Badge>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
              <span className="text-sm font-medium shrink-0">تغيير الحالة:</span>
              <Select
                value={order.status}
                onValueChange={(v) => updateStatusMutation.mutate(v)}
                disabled={updateStatusMutation.isPending}
              >
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map((s) => (
                    <SelectItem key={s} value={s}>{STATUS_LABELS[s]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Status timeline */}
            <div className="flex items-center gap-1 pt-2 overflow-x-auto">
              {STATUS_OPTIONS.filter((s) => s !== "cancelled").map((s, i, arr) => {
                const isDone = arr.indexOf(order.status as typeof arr[number]) >= i && order.status !== "cancelled"
                const isCurrent = s === order.status
                const Icon = STATUS_ICONS[s] ?? Clock
                return (
                  <div key={s} className="flex items-center gap-1 shrink-0">
                    <div className={`flex flex-col items-center gap-0.5 ${isDone ? "text-primary" : "text-muted-foreground"}`}>
                      <div className={`size-7 rounded-full flex items-center justify-center border-2 ${isCurrent ? "border-primary bg-primary text-primary-foreground" : isDone ? "border-primary bg-primary/10" : "border-border bg-background"}`}>
                        <Icon className={`size-3.5 ${isCurrent ? "text-primary-foreground" : ""}`} />
                      </div>
                      <span className="text-[10px] leading-tight whitespace-nowrap">{STATUS_LABELS[s]}</span>
                    </div>
                    {i < arr.length - 1 && (
                      <div className={`h-0.5 w-4 sm:w-8 ${isDone ? "bg-primary" : "bg-border"}`} />
                    )}
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* Customer info */}
          <Card>
            <CardHeader className="flex flex-row items-center gap-2 space-y-0">
              <User className="size-4" />
              <CardTitle className="text-base">معلومات العميل</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">الاسم</span>
                <span className="font-medium">{customerName}</span>
              </div>
              {order.user?.email && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">البريد الإلكتروني</span>
                  <span className="font-medium">{order.user.email}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-muted-foreground">رقم الطلب</span>
                <span className="font-mono">#{order.displayId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">تاريخ الطلب</span>
                <span>{new Date(order.createdAt).toLocaleString("ar-TN", { dateStyle: "medium", timeStyle: "short" })}</span>
              </div>
            </CardContent>
          </Card>

          {/* Shipping address */}
          <Card>
            <CardHeader className="flex flex-row items-center gap-2 space-y-0">
              <MapPin className="size-4" />
              <CardTitle className="text-base">عنوان الشحن</CardTitle>
            </CardHeader>
            <CardContent className="text-sm">
              {shipping ? (
                <div className="space-y-1.5">
                  {shipping.firstName && shipping.lastName && (
                    <p className="font-medium">{shipping.firstName} {shipping.lastName}</p>
                  )}
                  {shipping.phone && <p className="text-muted-foreground">{shipping.phone}</p>}
                  <p>{shipping.address || shipping.address1}</p>
                  {(shipping.city || shipping.postalCode) && (
                    <p>{[shipping.city, shipping.postalCode].filter(Boolean).join("، ")}</p>
                  )}
                  {shipping.country && <p className="text-muted-foreground">{shipping.country}</p>}
                </div>
              ) : (
                <p className="text-muted-foreground">لا يوجد عنوان شحن</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Order items */}
        <Card>
          <CardHeader className="flex flex-row items-center gap-2 space-y-0">
            <PackageIcon className="size-4" />
            <CardTitle className="text-base">المنتجات ({order.items?.length ?? 0})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-14"></TableHead>
                    <TableHead>المنتج</TableHead>
                    <TableHead className="text-center">الكمية</TableHead>
                    <TableHead className="text-right">السعر</TableHead>
                    <TableHead className="text-right">الإجمالي</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {order.items?.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>
                        {item.thumbnail ? (
                          <div className="relative size-10 overflow-hidden rounded-md bg-muted">
                            <Image src={item.thumbnail} alt="" fill className="object-cover" sizes="40px" />
                          </div>
                        ) : (
                          <div className="size-10 rounded-md bg-muted flex items-center justify-center">
                            <PackageIcon className="size-4 text-muted-foreground" />
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="font-medium">{item.title}</TableCell>
                      <TableCell className="text-center">{item.quantity}</TableCell>
                      <TableCell className="text-right">{formatCurrency(item.unitPrice)}</TableCell>
                      <TableCell className="text-right font-semibold">{formatCurrency(item.unitPrice * item.quantity)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Totals */}
        <Card>
          <CardHeader className="flex flex-row items-center gap-2 space-y-0">
            <CreditCard className="size-4" />
            <CardTitle className="text-base">ملخص الفاتورة</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {(order.subtotal != null) && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">المجموع الفرعي</span>
                <span>{formatCurrency(order.subtotal)}</span>
              </div>
            )}
            {(order.shippingFee != null && order.shippingFee > 0) && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">الشحن</span>
                <span>{formatCurrency(order.shippingFee)}</span>
              </div>
            )}
            {(order.discountAmount != null && order.discountAmount > 0) && (
              <div className="flex justify-between text-green-600">
                <span>الخصم {order.promoCode ? `(${order.promoCode})` : ""}</span>
                <span>-{formatCurrency(order.discountAmount)}</span>
              </div>
            )}
            <div className="flex justify-between pt-2 border-t font-bold text-base">
              <span>الإجمالي</span>
              <span>{formatCurrency(order.total)}</span>
            </div>
          </CardContent>
        </Card>

        {/* Back */}
        <div className="flex justify-end">
          <Button variant="outline" asChild className="gap-2">
            <Link href="/admin/orders">
              <ArrowRight className="size-4" />
              العودة إلى الطلبات
            </Link>
          </Button>
        </div>
      </div>
    </AdminFormLayout>
  )
}
