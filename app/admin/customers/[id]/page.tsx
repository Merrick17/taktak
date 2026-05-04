"use client"

import { use, useMemo } from "react"
import Image from "next/image"
import Link from "next/link"
import { useQuery } from "@tanstack/react-query"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Skeleton } from "@/components/ui/skeleton"
import { AdminFormLayout } from "@/components/admin/admin-form-layout"
import { formatCurrency } from "@/lib/format-currency"
import { ArrowRight, Mail, Calendar, ShoppingBag, User } from "lucide-react"

const STATUS_LABELS: Record<string, string> = {
  pending: "قيد الانتظار",
  processing: "قيد المعالجة",
  shipped: "تم الشحن",
  delivered: "تم التسليم",
  cancelled: "ملغي",
  completed: "مكتمل",
}

const STATUS_VARIANTS: Record<string, "default" | "outline" | "secondary" | "destructive"> = {
  pending: "outline",
  processing: "secondary",
  shipped: "default",
  delivered: "default",
  cancelled: "destructive",
  completed: "default",
}

interface CustomerOrder {
  id: string
  displayId: string
  total: number
  status: string
  createdAt: string
  items?: { id: string; title: string; quantity: number; unitPrice: number }[]
}

interface CustomerData {
  id: string
  email: string
  firstName: string | null
  lastName: string | null
  role: string
  createdAt: string
  updatedAt: string
  orders: CustomerOrder[]
}

export default function CustomerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)

  const { data: customer, isPending, error } = useQuery<CustomerData>({
    queryKey: ["admin-customer", id],
    queryFn: async () => {
      const res = await fetch(`/api/customers/${id}`, { credentials: "include" })
      if (!res.ok) throw new Error("Failed to fetch customer")
      return res.json()
    },
  })

  const totalSpent = useMemo(
    () => customer?.orders?.reduce((sum: number, o: CustomerOrder) => sum + Number(o.total), 0) ?? 0,
    [customer?.orders]
  )

  const displayName = useMemo(() => {
    if (!customer) return "—"
    if (customer.firstName || customer.lastName) return `${customer.firstName ?? ""} ${customer.lastName ?? ""}`.trim()
    return customer.email
  }, [customer])

  if (isPending) {
    return (
      <AdminFormLayout title="تفاصيل العميل" backHref="/admin/customers" backLabel="العملاء">
        <div className="space-y-6">
          <Skeleton className="h-40 w-full" />
          <Skeleton className="h-60 w-full" />
        </div>
      </AdminFormLayout>
    )
  }

  if (error || !customer) {
    return (
      <AdminFormLayout title="تفاصيل العميل" backHref="/admin/customers" backLabel="العملاء">
        <div className="flex flex-col items-center justify-center py-24 gap-2">
          <p className="text-destructive font-medium">لم يتم العثور على العميل</p>
          <p className="text-sm text-muted-foreground">{error?.message ?? "حدث خطأ أثناء تحميل بيانات العميل."}</p>
        </div>
      </AdminFormLayout>
    )
  }

  return (
    <AdminFormLayout
      title={displayName}
      backHref="/admin/customers"
      backLabel="العملاء"
    >
      <div className="space-y-6">

        {/* Profile card */}
        <Card>
          <CardHeader className="flex flex-row items-center gap-4 space-y-0">
            <div className="size-14 rounded-full bg-primary/10 flex items-center justify-center text-xl font-bold text-primary shrink-0">
              {(customer.firstName ?? customer.email)[0]?.toUpperCase() ?? "?"}
            </div>
            <div className="min-w-0">
              <CardTitle className="text-lg truncate">{displayName}</CardTitle>
              <p className="text-sm text-muted-foreground">{customer.email}</p>
            </div>
            {customer.role === "admin" && (
              <Badge variant="secondary" className="shrink-0">مدير</Badge>
            )}
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="flex items-center gap-2">
                <Mail className="size-4 text-muted-foreground" />
                <span className="text-muted-foreground">البريد:</span>
                <span className="font-medium truncate">{customer.email}</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="size-4 text-muted-foreground" />
                <span className="text-muted-foreground">تاريخ التسجيل:</span>
                <span className="font-medium">{new Date(customer.createdAt).toLocaleDateString("ar-TN")}</span>
              </div>
              <div className="flex items-center gap-2">
                <ShoppingBag className="size-4 text-muted-foreground" />
                <span className="text-muted-foreground">الطلبات:</span>
                <span className="font-medium">{customer.orders?.length ?? 0}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="border-0 bg-primary/5">
            <CardContent className="pt-4 pb-4">
              <p className="text-xs text-muted-foreground">إجمالي المشتريات</p>
              <p className="text-2xl font-bold">{formatCurrency(totalSpent)}</p>
            </CardContent>
          </Card>
          <Card className="border-0 bg-green-500/5">
            <CardContent className="pt-4 pb-4">
              <p className="text-xs text-muted-foreground">الطلبات المكتملة</p>
              <p className="text-2xl font-bold">{customer.orders?.filter((o) => o.status === "completed" || o.status === "delivered").length ?? 0}</p>
            </CardContent>
          </Card>
          <Card className="border-0 bg-orange-500/5">
            <CardContent className="pt-4 pb-4">
              <p className="text-xs text-muted-foreground">متوسط قيمة الطلب</p>
              <p className="text-2xl font-bold">
                {customer.orders?.length
                  ? formatCurrency(totalSpent / customer.orders.length)
                  : "—"}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Order history */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">سجل الطلبات</CardTitle>
          </CardHeader>
          <CardContent>
            {!customer.orders || customer.orders.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">لا توجد طلبات بعد</p>
            ) : (
              <div className="rounded-md border overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>رقم الطلب</TableHead>
                      <TableHead>التاريخ</TableHead>
                      <TableHead>المنتجات</TableHead>
                      <TableHead>الحالة</TableHead>
                      <TableHead className="text-right">الإجمالي</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {customer.orders.map((order) => (
                      <TableRow key={order.id} className="cursor-pointer hover:bg-muted/30">
                        <TableCell className="font-medium">#{order.displayId}</TableCell>
                        <TableCell className="text-muted-foreground">
                          {new Date(order.createdAt).toLocaleDateString("ar-TN", { month: "short", day: "numeric" })}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {order.items?.length ?? 0} صنف
                        </TableCell>
                        <TableCell>
                          <Badge variant={STATUS_VARIANTS[order.status] ?? "outline"}>
                            {STATUS_LABELS[order.status] ?? order.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right font-semibold">{formatCurrency(order.total)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Back */}
        <div className="flex justify-end">
          <Button variant="outline" asChild className="gap-2">
            <Link href="/admin/customers">
              <ArrowRight className="size-4" />
              العودة إلى العملاء
            </Link>
          </Button>
        </div>
      </div>
    </AdminFormLayout>
  )
}
