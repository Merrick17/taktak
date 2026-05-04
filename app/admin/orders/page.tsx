"use client"

import { useState, useMemo } from "react"
import { useRouter } from "next/navigation"
import { useQuery } from "@tanstack/react-query"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useDebounce } from "@/hooks/use-debounce"
import { formatCurrency } from "@/lib/format-currency"
import { Search, ExternalLink, ChevronLeft, ChevronRight, TrendingUp, ShoppingBag, Clock } from "lucide-react"
import { cn } from "@/lib/utils"

interface Order {
  id: string
  displayId: string
  total: number
  currencyCode: string
  status: string
  createdAt: string
  user: { id: string; email: string; firstName: string | null; lastName: string | null }
  items: { id: string; title: string; quantity: number; unitPrice: number }[]
}

interface OrdersResponse {
  orders: Order[]
  total: number
  page: number
  totalPages: number
}

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

type DatePreset = "today" | "yesterday" | "week" | "month" | "all"

const DATE_PRESETS: { value: DatePreset; label: string }[] = [
  { value: "today", label: "اليوم" },
  { value: "yesterday", label: "الأمس" },
  { value: "week", label: "هذا الأسبوع" },
  { value: "month", label: "هذا الشهر" },
  { value: "all", label: "الكل" },
]

function getDateRange(preset: DatePreset): { dateFrom: string; dateTo: string } {
  const now = new Date()
  const startOfDay = (d: Date) => {
    const r = new Date(d)
    r.setHours(0, 0, 0, 0)
    return r
  }
  const endOfDay = (d: Date) => {
    const r = new Date(d)
    r.setHours(23, 59, 59, 999)
    return r
  }

  if (preset === "today") {
    return { dateFrom: startOfDay(now).toISOString(), dateTo: endOfDay(now).toISOString() }
  }
  if (preset === "yesterday") {
    const yest = new Date(now)
    yest.setDate(yest.getDate() - 1)
    return { dateFrom: startOfDay(yest).toISOString(), dateTo: endOfDay(yest).toISOString() }
  }
  if (preset === "week") {
    const start = new Date(now)
    start.setDate(now.getDate() - now.getDay())
    return { dateFrom: startOfDay(start).toISOString(), dateTo: endOfDay(now).toISOString() }
  }
  if (preset === "month") {
    const start = new Date(now.getFullYear(), now.getMonth(), 1)
    return { dateFrom: startOfDay(start).toISOString(), dateTo: endOfDay(now).toISOString() }
  }
  return { dateFrom: "", dateTo: "" }
}

  const PAGE_SIZE = 20

const todayStatsKey = "admin-orders-today-summary"

export default function AdminOrdersPage() {
  const router = useRouter()
  const [searchTerm, setSearchTerm] = useState("")
  const debouncedSearch = useDebounce(searchTerm, 300)
  const [statusFilter, setStatusFilter] = useState("all")
  const [datePreset, setDatePreset] = useState<DatePreset>("all")
  const [page, setPage] = useState(1)

  const dateRange = useMemo(() => getDateRange(datePreset), [datePreset])

  const { data, isPending } = useQuery<OrdersResponse>({
    queryKey: ["admin-orders", page, statusFilter, debouncedSearch, datePreset],
    queryFn: async () => {
      const params = new URLSearchParams({
        limit: String(PAGE_SIZE),
        page: String(page),
        ...(statusFilter && statusFilter !== "all" ? { status: statusFilter } : {}),
        ...(debouncedSearch ? { search: debouncedSearch } : {}),
        ...(dateRange.dateFrom ? { dateFrom: dateRange.dateFrom } : {}),
        ...(dateRange.dateTo ? { dateTo: dateRange.dateTo } : {}),
      })
      const res = await fetch(`/api/orders?${params}`)
      if (!res.ok) throw new Error("Failed to fetch orders")
      return res.json()
    },
  })

  const orders = data?.orders ?? []
  const total = data?.total ?? 0
  const totalPages = data?.totalPages ?? 1

  // Today's summary — lightweight query (smaller limit, just enough for the strip)
  const { data: todayData } = useQuery<OrdersResponse>({
    queryKey: [todayStatsKey],
    queryFn: async () => {
      const { dateFrom, dateTo } = getDateRange("today")
      const params = new URLSearchParams({ limit: "50", page: "1", dateFrom, dateTo })
      const res = await fetch(`/api/orders?${params}`)
      if (!res.ok) throw new Error("Failed")
      return res.json()
    },
    staleTime: 60_000,
  })

  const todayOrders = todayData?.total ?? 0
  const todayRevenue = (todayData?.orders ?? []).reduce((s, o) => s + Number(o.total), 0)
  const todayPending = (todayData?.orders ?? []).filter((o) => o.status === "pending").length

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">إدارة الطلبات</h1>
        <p className="text-muted-foreground">تتبع الطلبات وتحديث حالات الشحن والتسليم.</p>
      </div>

      {/* Today's summary strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border-0 bg-primary/5">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-3">
              <ShoppingBag className="size-5 text-primary shrink-0" />
              <div>
                <p className="text-xs text-muted-foreground">طلبات اليوم</p>
                {isPending ? <Skeleton className="h-8 w-12 mt-0.5" /> : <p className="text-2xl font-bold">{todayOrders}</p>}
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 bg-green-500/5">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-3">
              <TrendingUp className="size-5 text-green-600 shrink-0" />
              <div>
                <p className="text-xs text-muted-foreground">إيرادات اليوم</p>
                {isPending ? <Skeleton className="h-8 w-28 mt-0.5" /> : <p className="text-2xl font-bold">{formatCurrency(todayRevenue)}</p>}
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 bg-orange-500/5">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-3">
              <Clock className="size-5 text-orange-500 shrink-0" />
              <div>
                <p className="text-xs text-muted-foreground">تنتظر المعالجة</p>
                {isPending ? <Skeleton className="h-8 w-12 mt-0.5" /> : <p className="text-2xl font-bold">{todayPending}</p>}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="space-y-3">
          {/* Date preset chips */}
          <div className="flex flex-wrap gap-2">
            {DATE_PRESETS.map((p) => (
              <button
                key={p.value}
                onClick={() => { setDatePreset(p.value); setPage(1) }}
                className={cn(
                  "rounded-full px-3.5 py-1 text-sm font-medium transition-colors border",
                  datePreset === p.value
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-background text-muted-foreground border-border hover:border-primary hover:text-primary"
                )}
              >
                {p.label}
              </button>
            ))}
          </div>

          {/* Search + status row */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <CardTitle>
              {DATE_PRESETS.find((p) => p.value === datePreset)?.label} ({total})
            </CardTitle>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto min-w-0">
              <div className="relative w-full sm:w-56 min-w-0">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <Input
                  placeholder="بحث برقم الطلب أو العميل..."
                  className="pl-9 w-full"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <Select
                value={statusFilter}
                onValueChange={(v) => { setStatusFilter(v); setPage(1) }}
              >
                <SelectTrigger className="w-full sm:w-40 shrink-0">
                  <SelectValue placeholder="الحالة" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">كل الحالات</SelectItem>
                  {Object.entries(STATUS_LABELS).map(([key, label]) => (
                    <SelectItem key={key} value={key}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>رقم الطلب</TableHead>
                  <TableHead>العميل</TableHead>
                  <TableHead>الوقت</TableHead>
                  <TableHead>المنتجات</TableHead>
                  <TableHead>الإجمالي</TableHead>
                  <TableHead>الحالة</TableHead>
                  <TableHead className="text-right">تفاصيل</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isPending ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-8" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                      <TableCell><Skeleton className="h-6 w-24 rounded-full" /></TableCell>
                      <TableCell><Skeleton className="h-8 w-8 rounded ms-auto" /></TableCell>
                    </TableRow>
                  ))
                ) : orders.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-10 text-muted-foreground">
                      لا توجد طلبات مطابقة
                    </TableCell>
                  </TableRow>
                ) : (
                  orders.map((order) => (
                    <TableRow
                      key={order.id}
                      className="cursor-pointer hover:bg-muted/30"
                      onClick={() => router.push(`/admin/orders/${order.id}`)}
                    >
                      <TableCell className="font-medium">#{order.displayId}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {order.user?.firstName && order.user?.lastName
                          ? `${order.user.firstName} ${order.user.lastName}`
                          : (order.user?.email ?? "—")}
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {new Date(order.createdAt).toLocaleString("ar-TN", {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {order.items?.length ?? 0} صنف
                      </TableCell>
                      <TableCell className="font-semibold">
                        {formatCurrency(Number(order.total))}
                      </TableCell>
                      <TableCell>
                        <Badge variant={STATUS_VARIANTS[order.status] ?? "outline"}>
                          {STATUS_LABELS[order.status] ?? order.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                        <Button variant="ghost" size="icon" onClick={() => router.push(`/admin/orders/${order.id}`)}>
                          <ExternalLink className="size-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between text-sm text-muted-foreground">
            <span className="min-w-0">صفحة {page} من {totalPages} — {total} طلب</span>
            <div className="flex items-center gap-2 shrink-0">
              <Button
                variant="outline"
                size="icon"
                className="size-8"
                disabled={page <= 1 || isPending}
                onClick={() => setPage((p) => p - 1)}
              >
                <ChevronRight className="size-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="size-8"
                disabled={page >= totalPages || isPending}
                onClick={() => setPage((p) => p + 1)}
              >
                <ChevronLeft className="size-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
