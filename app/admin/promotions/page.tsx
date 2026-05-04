"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { DeleteDialog } from "@/components/admin/delete-dialog"
import { formatCurrencyValue } from "@/lib/format-currency"
import { Plus, Edit, Trash2, ChevronLeft, ChevronRight } from "lucide-react"

interface Promotion {
  id: string
  code: string
  value: number
  type: string
  isActive: boolean
  startDate: string | null
  endDate: string | null
  maxUses: number | null
  minOrderAmount: number | null
  usageCount: number
  createdAt: string
  _count?: { orders: number }
}

interface PromotionsResponse {
  promotions: Promotion[]
  total: number
  page: number
  totalPages: number
}

const PAGE_SIZE = 20

export default function AdminPromotionsPage() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const { toast } = useToast()
  const [typeFilter, setTypeFilter] = useState("all")
  const [page, setPage] = useState(1)
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const { data, isPending } = useQuery<PromotionsResponse>({
    queryKey: ["admin-promotions", page, typeFilter],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(PAGE_SIZE),
        ...(typeFilter && typeFilter !== "all" ? { type: typeFilter } : {}),
      })
      const res = await fetch(`/api/promotions?${params}`, { credentials: "include" })
      if (!res.ok) throw new Error("Failed")
      return res.json()
    },
  })

  const promos = data?.promotions ?? []
  const total = data?.total ?? 0
  const totalPages = data?.totalPages ?? 1

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/promotions/${id}`, { method: "DELETE", credentials: "include" })
      if (!res.ok) throw new Error("Failed")
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-promotions"] })
      setDeleteId(null)
      toast({ title: "تم الحذف", description: "تم حذف العرض بنجاح." })
    },
    onError: () => toast({ variant: "destructive", title: "خطأ", description: "فشل الحذف." }),
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">إدارة العروض والخصومات</h1>
          <p className="text-muted-foreground">إنشاء وإدارة كوبونات الخصم والعروض الترويجية.</p>
        </div>
        <Button asChild className="gap-2">
          <Link href="/admin/promotions/new">
            <Plus className="size-4" />
            إضافة عرض
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <CardTitle>قائمة العروض ({total})</CardTitle>
            <div className="flex items-center gap-2">
              <Select
                value={typeFilter}
                onValueChange={(v) => { setTypeFilter(v); setPage(1) }}
              >
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="نوع العرض" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">الكل</SelectItem>
                  <SelectItem value="percentage">نسبة مئوية</SelectItem>
                  <SelectItem value="fixed">مبلغ ثابت</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>الكود</TableHead>
                  <TableHead>القيمة</TableHead>
                  <TableHead>النوع</TableHead>
                  <TableHead>الحالة</TableHead>
                  <TableHead>الاستخدامات</TableHead>
                  <TableHead>الصلاحية</TableHead>
                  <TableHead className="text-right">إجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isPending
                  ? Array.from({ length: 4 }).map((_, i) => (
                      <TableRow key={i}>
                        <TableCell><Skeleton className="h-4 w-28 font-mono" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                        <TableCell><Skeleton className="h-6 w-20 rounded-full" /></TableCell>
                        <TableCell><Skeleton className="h-6 w-16 rounded-full" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-8" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                        <TableCell><div className="flex gap-2 justify-end"><Skeleton className="h-8 w-8 rounded" /><Skeleton className="h-8 w-8 rounded" /></div></TableCell>
                      </TableRow>
                    ))
                  : promos.length === 0
                  ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-10 text-muted-foreground">
                        لا توجد عروض
                      </TableCell>
                    </TableRow>
                  )
                  : promos.map((promo) => {
                    const now = new Date()
                    const expired = promo.endDate && new Date(promo.endDate) < now
                    const notStarted = promo.startDate && new Date(promo.startDate) > now
                    const statusLabel = !promo.isActive ? "معطّل" : expired ? "منتهي" : notStarted ? "لم يبدأ" : "نشط"
                    const statusVariant = !promo.isActive ? "outline" : expired ? "destructive" : notStarted ? "secondary" : "default"
                    return (
                      <TableRow key={promo.id}>
                        <TableCell className="font-medium">{promo.code}</TableCell>
                        <TableCell>
                          {promo.type === "percentage"
                            ? `${Number(promo.value)}%`
                            : `${formatCurrencyValue(Number(promo.value))} د.ت`}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {promo.type === "percentage" ? "نسبة مئوية" : "مبلغ ثابت"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={statusVariant as "default" | "outline" | "secondary" | "destructive"}>
                            {statusLabel}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {(promo._count?.orders ?? 0) > 0
                            ? `${promo._count!.orders}${promo.maxUses ? ` / ${promo.maxUses}` : ""}`
                            : promo.maxUses
                              ? `0 / ${promo.maxUses}`
                              : "—"}
                        </TableCell>
                        <TableCell className="text-muted-foreground text-sm">
                          {promo.startDate || promo.endDate
                            ? <>
                                {promo.startDate && <span>{new Date(promo.startDate).toLocaleDateString("ar-TN")}</span>}
                                {(promo.startDate && promo.endDate) && " — "}
                                {promo.endDate && <span>{new Date(promo.endDate).toLocaleDateString("ar-TN")}</span>}
                              </>
                            : "—"}
                        </TableCell>
                        <TableCell className="text-right space-x-1 rtl:space-x-reverse">
                          <Button
                            variant="ghost"
                            size="icon"
                            aria-label="تعديل العرض"
                            onClick={() => router.push(`/admin/promotions/${promo.id}/edit`)}
                          >
                            <Edit className="size-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-destructive"
                            aria-label="حذف العرض"
                            onClick={() => setDeleteId(promo.id)}
                          >
                            <Trash2 className="size-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    )
                  })}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          <div className="mt-4 flex items-center justify-between text-sm text-muted-foreground">
            <span>
              صفحة {page} من {totalPages} — {total} عرض
            </span>
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
        title="حذف هذا العرض؟"
        description="سيتم حذف العرض الترويجي نهائياً. لا يمكن التراجع عن هذا الإجراء."
        loading={deleteMutation.isPending}
        onConfirm={() => { if (deleteId) deleteMutation.mutate(deleteId) }}
      />
    </div>
  )
}
