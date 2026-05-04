"use client"

import { useQuery } from "@tanstack/react-query"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { BarChart3, DollarSign, Package, ShoppingBag, Users } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"
import { formatCurrency } from "@/lib/format-currency"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"
import { AreaChart, Area, XAxis, YAxis, CartesianGrid } from "recharts"
import Link from "next/link"

interface DashboardStats {
  totalSales: number
  totalOrders: number
  totalProducts: number
  totalCustomers: number
  recentOrders: {
    id: string
    displayId: string
    total: number
    currencyCode: string
    status: string
    createdAt: string
    customerName: string
    itemCount: number
  }[]
  salesLast7Days?: { date: string; revenue: number; orders: number }[]
}

const STATUS_LABELS: Record<string, string> = {
  pending: "قيد الانتظار",
  processing: "قيد المعالجة",
  shipped: "تم الشحن",
  delivered: "تم التسليم",
  cancelled: "ملغي",
  completed: "مكتمل",
}

export default function AdminDashboardPage() {
  const { data: stats, isPending, error } = useQuery<DashboardStats>({
    queryKey: ["admin-stats"],
    queryFn: async () => {
      const res = await fetch("/api/stats")
      if (!res.ok) throw new Error("Failed to fetch stats")
      return res.json()
    },
  })

  const STATS = [
    { label: "إجمالي المبيعات", value: stats ? formatCurrency(stats.totalSales) : "—", icon: DollarSign, color: "text-green-600" },
    { label: "الطلبات", value: stats?.totalOrders?.toLocaleString("ar-TN") ?? "—", icon: ShoppingBag, color: "text-blue-600" },
    { label: "المنتجات", value: stats?.totalProducts?.toLocaleString("ar-TN") ?? "—", icon: Package, color: "text-orange-600" },
    { label: "العملاء", value: stats?.totalCustomers?.toLocaleString("ar-TN") ?? "—", icon: Users, color: "text-purple-600" },
  ]

  if (error && !stats) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4">
        <p className="text-destructive font-medium">فشل تحميل البيانات</p>
        <p className="text-sm text-muted-foreground">تعذر جلب إحصائيات المتجر. يرجى المحاولة لاحقاً.</p>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">نظرة عامة</h1>
        <p className="text-muted-foreground mt-1">مرحباً بك مجدداً في لوحة التحكم.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {STATS.map((stat) => (
          <Card key={stat.label}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.label}</CardTitle>
              <stat.icon className={cn("h-4 w-4", stat.color)} />
            </CardHeader>
            <CardContent>
              {isPending ? (
                <Skeleton className="h-8 w-24" />
              ) : (
                <div className="text-2xl font-bold">{stat.value}</div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card className="p-6">
          <CardHeader>
            <CardTitle className="text-lg">آخر الطلبات</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {isPending ? (
              Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center justify-between p-3 rounded-lg border border-border bg-muted/20">
                  <div className="flex gap-3 items-center">
                    <Skeleton className="size-8 rounded-full shrink-0" />
                    <div className="space-y-1.5">
                      <Skeleton className="h-4 w-28" />
                      <Skeleton className="h-3 w-20" />
                    </div>
                  </div>
                  <div className="text-right space-y-1.5">
                    <Skeleton className="h-4 w-16 ms-auto" />
                    <Skeleton className="h-3 w-16 ms-auto" />
                  </div>
                </div>
              ))
            ) : stats?.recentOrders?.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">لا توجد طلبات بعد</p>
            ) : (
              stats?.recentOrders?.map((order) => (
                <Link
                  key={order.id}
                  href={`/admin/orders/${order.id}`}
                  className="flex items-center justify-between p-3 rounded-lg border border-border bg-muted/20 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex gap-3 items-center min-w-0">
                    <div className="size-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary shrink-0">
                      {order.customerName?.charAt(0) ?? "?"}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{order.customerName}</p>
                      <p className="text-xs text-muted-foreground">
                        #{order.displayId} — {STATUS_LABELS[order.status] ?? order.status}
                      </p>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-bold">{formatCurrency(order.total)}</p>
                    <p className="text-xs text-muted-foreground">{order.itemCount} منتج</p>
                  </div>
                </Link>
              ))
            )}
          </CardContent>
        </Card>

        <Card className="p-6">
          <CardHeader>
            <CardTitle className="text-lg">أداء المبيعات</CardTitle>
          </CardHeader>
          <CardContent>
            {isPending ? (
              <Skeleton className="h-[200px] w-full" />
            ) : stats?.salesLast7Days && stats.salesLast7Days.length > 0 ? (() => {
              const chartConfig: ChartConfig = {
                revenue: { label: "الإيرادات (د.ت)", color: "hsl(var(--chart-1))" },
              }
              const chartData = stats.salesLast7Days.map((d) => ({
                ...d,
                date: new Date(d.date).toLocaleDateString("ar-TN", { month: "short", day: "numeric" }),
              }))
              return (
                <ChartContainer config={chartConfig} className="h-[200px] w-full">
                  <AreaChart data={chartData} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--chart-1))" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="hsl(var(--chart-1))" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis dataKey="date" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                    <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} width={50} />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Area
                      type="monotone"
                      dataKey="revenue"
                      stroke="hsl(var(--chart-1))"
                      fill="url(#colorRevenue)"
                      strokeWidth={2}
                      dot={{ r: 3 }}
                    />
                  </AreaChart>
                </ChartContainer>
              )
            })() : (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <BarChart3 className="size-12 text-muted-foreground mb-4" />
                <p className="text-sm text-muted-foreground">لا توجد بيانات مبيعات بعد.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
