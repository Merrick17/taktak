"use client"

import { useState, useMemo } from "react"
import { useQuery } from "@tanstack/react-query"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts"
import { TrendingUp, ShoppingBag, Package } from "lucide-react"
import { cn } from "@/lib/utils"
import { formatCurrency, formatCurrencyValue } from "@/lib/format-currency"

interface StatsData {
  totalSales: number
  totalOrders: number
  totalProducts: number
  totalCustomers: number
  salesLast7Days: { date: string; revenue: number; orders: number }[]
  ordersByStatus: { status: string; count: number }[]
  topProducts: { productId: string; title: string; units: number }[]
}

const STATUS_LABELS: Record<string, string> = {
  pending: "قيد الانتظار",
  processing: "قيد المعالجة",
  shipped: "تم الشحن",
  delivered: "تم التسليم",
  cancelled: "ملغي",
  completed: "مكتمل",
}

const STATUS_COLORS = [
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
  "hsl(var(--chart-1))",
]

const revenueConfig: ChartConfig = {
  revenue: { label: "الإيرادات (د.ت)", color: "hsl(var(--chart-1))" },
}

const ordersConfig: ChartConfig = {
  orders: { label: "الطلبات", color: "hsl(var(--chart-2))" },
}

type DateRange = "7d" | "30d" | "90d"

const DATE_RANGES: { value: DateRange; label: string }[] = [
  { value: "7d", label: "آخر 7 أيام" },
  { value: "30d", label: "آخر 30 يوم" },
  { value: "90d", label: "آخر 90 يوم" },
]

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("ar-TN", { month: "short", day: "numeric" })
}

export default function AdminAnalyticsPage() {
  const [dateRange, setDateRange] = useState<DateRange>("7d")

  const { data: stats, isPending } = useQuery<StatsData>({
    queryKey: ["admin-stats-full", dateRange],
    queryFn: async () => {
      const days = dateRange === "7d" ? 7 : dateRange === "30d" ? 30 : 90
      const from = new Date()
      from.setDate(from.getDate() - days + 1)
      from.setHours(0, 0, 0, 0)
      const params = new URLSearchParams({ dateFrom: from.toISOString() })
      const res = await fetch(`/api/stats?${params}`, { credentials: "include" })
      if (!res.ok) throw new Error("Failed")
      return res.json()
    },
  })

  const chartData = stats?.salesLast7Days?.map((d) => ({
    ...d,
    date: formatDate(d.date),
  })) ?? []

  const pieData = stats?.ordersByStatus?.map((s, i) => ({
    name: STATUS_LABELS[s.status] ?? s.status,
    value: s.count,
    color: STATUS_COLORS[i % STATUS_COLORS.length],
  })) ?? []

  const totalOrders = pieData.reduce((s, d) => s + d.value, 0)

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">التقارير والتحليلات</h1>
          <p className="text-muted-foreground mt-1">نظرة تحليلية على أداء المتجر.</p>
        </div>
        <Select value={dateRange} onValueChange={(v) => setDateRange(v as DateRange)}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {DATE_RANGES.map((r) => (
              <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Revenue area chart */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <TrendingUp className="size-4" />
              الإيرادات
            </CardTitle>
            <CardDescription>
              {stats
                ? `إجمالي: ${formatCurrency(stats.salesLast7Days.reduce((s, d) => s + d.revenue, 0))}`
                : "جاري التحميل..."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isPending ? (
              <Skeleton className="h-[220px] w-full" />
            ) : (
              <ChartContainer config={revenueConfig} className="h-[220px] w-full">
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
            )}
          </CardContent>
        </Card>

        {/* Orders bar chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <ShoppingBag className="size-4" />
              الطلبات
            </CardTitle>
            <CardDescription>
              {stats
                ? `إجمالي: ${stats.salesLast7Days.reduce((s, d) => s + d.orders, 0)} طلب`
                : "جاري التحميل..."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isPending ? (
              <Skeleton className="h-[220px] w-full" />
            ) : (
              <ChartContainer config={ordersConfig} className="h-[220px] w-full">
                <BarChart data={chartData} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11 }} tickLine={false} axisLine={false} width={30} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="orders" fill="hsl(var(--chart-2))" radius={[4, 4, 0, 0]} maxBarSize={40} />
                </BarChart>
              </ChartContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Orders by status pie + top products */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">الطلبات حسب الحالة</CardTitle>
            <CardDescription>{totalOrders} طلب إجمالاً</CardDescription>
          </CardHeader>
          <CardContent>
            {isPending ? (
              <Skeleton className="h-[260px] w-full" />
            ) : pieData.length === 0 ? (
              <div className="flex h-[260px] items-center justify-center text-sm text-muted-foreground">
                لا توجد بيانات بعد
              </div>
            ) : (
              <div className="flex flex-col items-center gap-4">
                <ChartContainer
                  config={Object.fromEntries(
                    pieData.map((d, i) => [
                      d.name,
                      { label: d.name, color: STATUS_COLORS[i % STATUS_COLORS.length] },
                    ])
                  )}
                  className="h-[200px] w-full"
                >
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={85}
                      dataKey="value"
                      nameKey="name"
                    >
                      {pieData.map((entry, i) => (
                        <Cell key={`cell-${i}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <ChartTooltip content={<ChartTooltipContent hideLabel />} />
                  </PieChart>
                </ChartContainer>
                <div className="flex flex-wrap justify-center gap-x-4 gap-y-1">
                  {pieData.map((d) => (
                    <span key={d.name} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <span className={cn("inline-block size-2.5 rounded-full", {
                        "bg-chart-1": d.color === STATUS_COLORS[0],
                        "bg-chart-2": d.color === STATUS_COLORS[1],
                        "bg-chart-3": d.color === STATUS_COLORS[2],
                        "bg-chart-4": d.color === STATUS_COLORS[3],
                        "bg-chart-5": d.color === STATUS_COLORS[4],
                      })} />
                      {d.name} ({d.value})
                    </span>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Top products */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Package className="size-4" />
              أفضل المنتجات مبيعاً
            </CardTitle>
            <CardDescription>حسب عدد الوحدات المباعة</CardDescription>
          </CardHeader>
          <CardContent>
            {isPending ? (
              <div className="space-y-4">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="space-y-1.5">
                    <div className="flex justify-between">
                      <Skeleton className="h-4 w-40" />
                      <Skeleton className="h-4 w-12" />
                    </div>
                    <Skeleton className="h-2 w-full rounded-full" />
                  </div>
                ))}
              </div>
            ) : !stats?.topProducts?.length ? (
              <div className="flex h-[200px] items-center justify-center text-sm text-muted-foreground">
                لا توجد بيانات بعد
              </div>
            ) : (
              <ul className="space-y-3">
                {stats.topProducts.map((p, i) => {
                  const maxUnits = stats.topProducts[0]?.units ?? 1
                  const pct = Math.round((p.units / maxUnits) * 100)
                  return (
                    <li key={p.productId} className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <span className="flex items-center gap-2 min-w-0">
                          <span className="text-xs font-bold text-muted-foreground w-4 shrink-0">#{i + 1}</span>
                          <span className="truncate font-medium">{p.title}</span>
                        </span>
                        <Badge variant="secondary" className="shrink-0 ml-2">{p.units} وحدة</Badge>
                      </div>
                      <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                        <div
                          className="h-full rounded-full bg-primary transition-all"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </li>
                  )
                })}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
