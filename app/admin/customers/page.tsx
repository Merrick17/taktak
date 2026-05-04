"use client"

import { useState, useMemo } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { useToast } from "@/hooks/use-toast"
import { useDebounce } from "@/hooks/use-debounce"
import { DeleteDialog } from "@/components/admin/delete-dialog"
import { Search, ExternalLink, Trash2, ChevronLeft, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"

interface Customer {
  id: string
  email: string
  firstName: string | null
  lastName: string | null
  createdAt: string
  orders: { id: string }[]
}

interface CustomersResponse {
  customers: Customer[]
  total: number
  page: number
  totalPages: number
}

type DatePreset = "today" | "week" | "month" | "all"

const DATE_PRESETS: { value: DatePreset; label: string }[] = [
  { value: "today", label: "اليوم" },
  { value: "week", label: "هذا الأسبوع" },
  { value: "month", label: "هذا الشهر" },
  { value: "all", label: "الكل" },
]

function getDateRange(preset: DatePreset): { dateFrom: string; dateTo: string } {
  const now = new Date()
  const startOfDay = (d: Date) => { const r = new Date(d); r.setHours(0, 0, 0, 0); return r }
  const endOfDay = (d: Date) => { const r = new Date(d); r.setHours(23, 59, 59, 999); return r }

  if (preset === "today") return { dateFrom: startOfDay(now).toISOString(), dateTo: endOfDay(now).toISOString() }
  if (preset === "week") {
    const start = new Date(now); start.setDate(now.getDate() - now.getDay())
    return { dateFrom: startOfDay(start).toISOString(), dateTo: endOfDay(now).toISOString() }
  }
  if (preset === "month") {
    const start = new Date(now.getFullYear(), now.getMonth(), 1)
    return { dateFrom: startOfDay(start).toISOString(), dateTo: endOfDay(now).toISOString() }
  }
  return { dateFrom: "", dateTo: "" }
}

const PAGE_SIZE = 20

export default function AdminCustomersPage() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const { toast } = useToast()
  const [searchTerm, setSearchTerm] = useState("")
  const debouncedSearch = useDebounce(searchTerm, 300)
  const [datePreset, setDatePreset] = useState<DatePreset>("all")
  const [page, setPage] = useState(1)
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const dateRange = useMemo(() => getDateRange(datePreset), [datePreset])

  const { data, isPending } = useQuery<CustomersResponse>({
    queryKey: ["admin-customers", page, debouncedSearch, datePreset],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(PAGE_SIZE),
        ...(debouncedSearch ? { search: debouncedSearch } : {}),
        ...(dateRange.dateFrom ? { dateFrom: dateRange.dateFrom } : {}),
        ...(dateRange.dateTo ? { dateTo: dateRange.dateTo } : {}),
      })
      const res = await fetch(`/api/customers?${params}`, { credentials: "include" })
      if (!res.ok) throw new Error("Failed")
      return res.json()
    },
  })

  const customers = data?.customers ?? []
  const total = data?.total ?? 0
  const totalPages = data?.totalPages ?? 1

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/customers/${id}`, { method: "DELETE", credentials: "include" })
      if (!res.ok) throw new Error("Failed")
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-customers"] })
      setDeleteId(null)
      toast({ title: "تم الحذف", description: "تم حذف العميل بنجاح." })
    },
    onError: () => toast({ variant: "destructive", title: "خطأ", description: "فشل حذف العميل." }),
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">إدارة العملاء</h1>
        <p className="text-muted-foreground">إدارة بيانات العملاء وتتبع نشاطهم.</p>
      </div>

      <Card>
        <CardHeader className="space-y-3">
          {/* Date chips */}
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

          <div className="flex flex-wrap items-center justify-between gap-3">
            <CardTitle>
              {DATE_PRESETS.find((p) => p.value === datePreset)?.label} ({total} عميل)
            </CardTitle>
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                placeholder="بحث بالاسم أو البريد..."
                className="pl-9"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>العميل</TableHead>
                  <TableHead>البريد الإلكتروني</TableHead>
                  <TableHead>الطلبات</TableHead>
                  <TableHead>تاريخ التسجيل</TableHead>
                  <TableHead className="text-right">إجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isPending
                  ? Array.from({ length: 5 }).map((_, i) => (
                      <TableRow key={i}>
                        <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-40" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-8" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                        <TableCell><Skeleton className="h-8 w-8 rounded ms-auto" /></TableCell>
                      </TableRow>
                    ))
                  : customers.length === 0
                  ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-10 text-muted-foreground">
                        لا يوجد عملاء
                      </TableCell>
                    </TableRow>
                  )
                  : customers.map((c) => (
                    <TableRow
                      key={c.id}
                      className="cursor-pointer hover:bg-muted/30"
                      onClick={() => router.push(`/admin/customers/${c.id}`)}
                    >
                      <TableCell className="font-medium">
                        {c.firstName || c.lastName ? `${c.firstName ?? ""} ${c.lastName ?? ""}`.trim() : "—"}
                      </TableCell>
                      <TableCell className="text-muted-foreground">{c.email}</TableCell>
                      <TableCell><Badge variant="secondary">{c.orders?.length ?? 0}</Badge></TableCell>
                      <TableCell className="text-muted-foreground">
                        {new Date(c.createdAt).toLocaleDateString("ar-TN")}
                      </TableCell>
                      <TableCell
                        className="text-right space-x-1 rtl:space-x-reverse"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Button variant="ghost" size="icon" asChild aria-label="عرض تفاصيل العميل">
                          <Link href={`/admin/customers/${c.id}`}><ExternalLink className="size-4" /></Link>
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive"
                          aria-label="حذف العميل"
                          onClick={() => setDeleteId(c.id)}
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          <div className="mt-4 flex items-center justify-between text-sm text-muted-foreground">
            <span>صفحة {page} من {totalPages} — {total} عميل</span>
            <div className="flex items-center gap-2">
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

      <DeleteDialog
        open={deleteId !== null}
        onOpenChange={(open) => !open && setDeleteId(null)}
        title="حذف هذا العميل؟"
        description="سيتم حذف العميل وجميع بياناته نهائياً. لا يمكن التراجع عن هذا الإجراء."
        loading={deleteMutation.isPending}
        onConfirm={() => { if (deleteId) deleteMutation.mutate(deleteId) }}
      />
    </div>
  )
}
