"use client"

import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { useToast } from "@/hooks/use-toast"
import { useDebounce } from "@/hooks/use-debounce"
import { DeleteDialog } from "@/components/admin/delete-dialog"
import { Plus, Search, Edit, Trash2, ChevronLeft, ChevronRight, ImageOff } from "lucide-react"

const PAGE_SIZE = 10

interface Category {
  id: string
  name: string
  handle: string
  image?: string | null
  products: { id: string }[]
}

export default function AdminCategoriesPage() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const { toast } = useToast()
  const [searchTerm, setSearchTerm] = useState("")
  const [page, setPage] = useState(1)
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const debouncedSearch = useDebounce(searchTerm, 300)

  const { data: categories = [], isPending } = useQuery<Category[]>({
    queryKey: ["admin-categories", debouncedSearch],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (debouncedSearch) params.set("q", debouncedSearch)
      const res = await fetch(`/api/categories?${params}`, { credentials: "include" })
      if (!res.ok) throw new Error("Failed to fetch categories")
      return res.json()
    },
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/categories/${id}`, { method: "DELETE", credentials: "include" })
      if (!res.ok) throw new Error("Failed to delete")
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-categories"] })
      setDeleteId(null)
      toast({ title: "تم الحذف", description: "تم حذف التصنيف بنجاح." })
    },
    onError: () => toast({ variant: "destructive", title: "خطأ", description: "فشل حذف التصنيف." }),
  })

  const filtered = categories

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const safePage = Math.min(page, totalPages)
  const paginated = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">إدارة التصنيفات</h1>
          <p className="text-muted-foreground">تنظيم المنتجات في مجموعات وتصنيفات.</p>
        </div>
        <Button asChild className="gap-2">
          <Link href="/admin/categories/new">
            <Plus className="size-4" />
            إضافة تصنيف
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>قائمة التصنيفات ({categories.length})</CardTitle>
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                placeholder="بحث..."
                className="pl-9"
                value={searchTerm}
                onChange={(e) => { setSearchTerm(e.target.value) }}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-14">صورة</TableHead>
                  <TableHead>اسم التصنيف</TableHead>
                  <TableHead>المعرف (Handle)</TableHead>
                  <TableHead>المنتجات</TableHead>
                  <TableHead className="text-right">إجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isPending
                  ? Array.from({ length: 4 }).map((_, i) => (
                      <TableRow key={i}>
                        <TableCell><Skeleton className="h-10 w-10 rounded-lg" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-28" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-8" /></TableCell>
                        <TableCell><div className="flex gap-2 justify-end"><Skeleton className="h-8 w-8 rounded" /><Skeleton className="h-8 w-8 rounded" /></div></TableCell>
                      </TableRow>
                    ))
                  : paginated.length === 0
                  ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-10 text-muted-foreground">
                        لا توجد تصنيفات
                      </TableCell>
                    </TableRow>
                  )
                  : paginated.map((cat) => (
                    <TableRow key={cat.id}>
                      <TableCell>
                        {cat.image ? (
                          <div className="relative size-10 overflow-hidden rounded-md border bg-muted">
                            <Image src={cat.image} alt={cat.name} fill className="object-cover" sizes="40px" />
                          </div>
                        ) : (
                          <div className="flex size-10 items-center justify-center rounded-md border bg-muted text-muted-foreground">
                            <ImageOff className="size-4" />
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="font-medium">{cat.name}</TableCell>
                      <TableCell className="text-muted-foreground">{cat.handle}</TableCell>
                      <TableCell>{cat.products?.length ?? 0}</TableCell>
                      <TableCell className="text-right space-x-1 rtl:space-x-reverse">
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label="تعديل التصنيف"
                          onClick={() => router.push(`/admin/categories/${cat.id}/edit`)}
                        >
                          <Edit className="size-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive"
                          aria-label="حذف التصنيف"
                          onClick={() => setDeleteId(cat.id)}
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
          {totalPages > 1 && (
            <div className="mt-4 flex items-center justify-between text-sm text-muted-foreground">
              <span>
                صفحة {safePage} من {totalPages} — {filtered.length} تصنيف
              </span>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  className="size-8"
                  disabled={safePage <= 1}
                  onClick={() => setPage((p) => p - 1)}
                  aria-label="الصفحة السابقة"
                >
                  <ChevronRight className="size-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className="size-8"
                  disabled={safePage >= totalPages}
                  onClick={() => setPage((p) => p + 1)}
                  aria-label="الصفحة التالية"
                >
                  <ChevronLeft className="size-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <DeleteDialog
        open={deleteId !== null}
        onOpenChange={(open) => !open && setDeleteId(null)}
        title="حذف هذا التصنيف؟"
        description="سيتم حذف التصنيف نهائياً. لا يمكن التراجع عن هذا الإجراء."
        loading={deleteMutation.isPending}
        onConfirm={() => { if (deleteId) deleteMutation.mutate(deleteId) }}
      />
    </div>
  )
}
