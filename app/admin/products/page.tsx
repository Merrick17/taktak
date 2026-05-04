"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Plus,
  Search,
  Edit,
  Trash2,
  Upload,
  ChevronLeft,
  ChevronRight,
  Copy,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Product {
  id: string;
  title: string;
  handle: string;
  status: string;
  adsBoosted?: boolean;
  thumbnail?: string | null;
  images?: { url: string }[];
  categories?: { id: string; name: string }[];
  variants: {
    id: string;
    sku: string;
    title?: string | null;
    price: number;
    inventory: number;
  }[];
}

export default function AdminProductsPage() {
  const router = useRouter();

  function handleDuplicate(product: Product) {
    const data = {
      title: product.title + " (نسخة)",
      description: "",
      handle: product.handle + "-copy",
      status: "draft",
      adsBoosted: false,
      categoryIds: product.categories?.map((c) => c.id) ?? [],
      images: product.images?.map((img) => ({ url: img.url })) ?? [],
      variants: product.variants.map((v) => ({
        title: "",
        sku: v.sku + "-COPY",
        price: v.price,
        inventory: v.inventory,
        options: [],
      })),
    };
    const encoded = encodeURIComponent(JSON.stringify(data));
    router.push(`/admin/products/new?duplicate=${encoded}`);
  }
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [searchInput, setSearchInput] = useState("");
  const [debouncedQ, setDebouncedQ] = useState("");
  const [adminPage, setAdminPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState("all");
  const [datePreset, setDatePreset] = useState("all");
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const PAGE_SIZE = 20;

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQ(searchInput.trim()), 300);
    return () => clearTimeout(t);
  }, [searchInput]);

  const searchMountRef = useRef(true);
  useEffect(() => {
    if (searchMountRef.current) {
      searchMountRef.current = false;
      return;
    }
    const id = window.setTimeout(() => setAdminPage(1), 0);
    return () => clearTimeout(id);
  }, [debouncedQ]);

  type DatePreset = "today" | "week" | "month" | "all";
  const DATE_PRESETS: { value: DatePreset; label: string }[] = [
    { value: "today", label: "اليوم" },
    { value: "week", label: "هذا الأسبوع" },
    { value: "month", label: "هذا الشهر" },
    { value: "all", label: "الكل" },
  ];
  function getDateRange(preset: string): { dateFrom: string; dateTo: string } {
    const now = new Date();
    const s0 = (d: Date) => {
      const r = new Date(d);
      r.setHours(0, 0, 0, 0);
      return r;
    };
    const e23 = (d: Date) => {
      const r = new Date(d);
      r.setHours(23, 59, 59, 999);
      return r;
    };
    if (preset === "today")
      return {
        dateFrom: s0(now).toISOString(),
        dateTo: e23(now).toISOString(),
      };
    if (preset === "week") {
      const s = new Date(now);
      s.setDate(now.getDate() - now.getDay());
      return { dateFrom: s0(s).toISOString(), dateTo: e23(now).toISOString() };
    }
    if (preset === "month") {
      const s = new Date(now.getFullYear(), now.getMonth(), 1);
      return { dateFrom: s0(s).toISOString(), dateTo: e23(now).toISOString() };
    }
    return { dateFrom: "", dateTo: "" };
  }
  const { dateFrom, dateTo } = getDateRange(datePreset);

  const { data: adminData, isPending } = useQuery<{
    products: Product[];
    total: number;
    totalPages: number;
  }>({
    queryKey: [
      "admin-products",
      adminPage,
      statusFilter,
      datePreset,
      debouncedQ,
    ],
    queryFn: async () => {
      const params = new URLSearchParams({
        limit: String(PAGE_SIZE),
        page: String(adminPage),
        ...(statusFilter && statusFilter !== "all"
          ? { status: statusFilter }
          : {}),
        ...(dateFrom ? { dateFrom } : {}),
        ...(dateTo ? { dateTo } : {}),
        ...(debouncedQ ? { q: debouncedQ } : {}),
      });
      const res = await fetch(`/api/products?${params}`, {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to fetch products");
      const data = await res.json();
      if (Array.isArray(data))
        return { products: data, total: data.length, totalPages: 1 };
      return data;
    },
  });

  const products = adminData?.products ?? [];
  const totalPages = adminData?.totalPages ?? 1;
  const totalCount = adminData?.total ?? 0;

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/products/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to delete product");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-products"] });
      setDeleteId(null);
      toast({ title: "تم الحذف", description: "تم حذف المنتج بنجاح." });
    },
    onError: () =>
      toast({
        variant: "destructive",
        title: "خطأ",
        description: "فشل حذف المنتج.",
      }),
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
            إدارة المنتجات
          </h1>
          <p className="text-muted-foreground text-sm sm:text-base">
            إدارة كتالوج المنتجات والأسعار والمخزون.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto shrink-0">
          <Button variant="outline" asChild className="gap-2 w-full sm:w-auto">
            <Link href="/admin/products/import">
              <Upload className="size-4" />
              استيراد من ملف
            </Link>
          </Button>
          <Button asChild className="gap-2 w-full sm:w-auto">
            <Link href="/admin/products/new">
              <Plus className="size-4" />
              إضافة منتج
            </Link>
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <CardTitle>قائمة المنتجات ({totalCount})</CardTitle>
              <p className="text-xs text-muted-foreground mt-1">
                عمود «اسم في الرابط» يظهر في عنوان صفحة المنتج (أحرف لاتينية
                وأرقام وشرطات).
              </p>
            </div>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto min-w-0">
              <Select
                value={statusFilter}
                onValueChange={(v) => {
                  setStatusFilter(v);
                  setAdminPage(1);
                }}
              >
                <SelectTrigger className="w-full sm:w-36 shrink-0">
                  <SelectValue placeholder="الحالة" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">الكل</SelectItem>
                  <SelectItem value="published">منشور</SelectItem>
                  <SelectItem value="draft">مسودة</SelectItem>
                </SelectContent>
              </Select>
              <div className="relative w-full sm:w-64 min-w-0">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
                <Input
                  placeholder="بحث بالاسم أو الرابط..."
                  className="pl-9 w-full"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  aria-label="بحث عن منتج"
                />
              </div>
            </div>
          </div>

          <details className="rounded-lg border border-border bg-muted/30 px-3 py-2 text-sm">
            <summary className="cursor-pointer font-medium text-foreground list-none flex items-center gap-2 [&::-webkit-details-marker]:hidden">
              <span className="text-muted-foreground">▼</span>
              تصفية متقدمة: تاريخ إضافة المنتج
            </summary>
            <p className="text-xs text-muted-foreground mt-2 mb-3">
              يحدّد المنتجات التي أُضيفت إلى النظام خلال الفترة المختارة (وليس
              تاريخ الطلبات).
            </p>
            <div className="flex flex-wrap gap-2">
              {DATE_PRESETS.map((p) => (
                <button
                  key={p.value}
                  type="button"
                  onClick={() => {
                    setDatePreset(p.value);
                    setAdminPage(1);
                  }}
                  className={cn(
                    "rounded-full px-3.5 py-1 text-sm font-medium transition-colors border",
                    datePreset === p.value
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-background text-muted-foreground border-border hover:border-primary hover:text-primary",
                  )}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </details>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-14">صورة</TableHead>
                  <TableHead>المنتج</TableHead>
                  <TableHead className="min-w-[7rem] max-w-[12rem]">
                    التصنيفات
                  </TableHead>
                  <TableHead>اسم في الرابط</TableHead>
                  <TableHead>المتغيرات</TableHead>
                  <TableHead>الحالة</TableHead>
                  <TableHead>ترويج</TableHead>
                  <TableHead>المخزون</TableHead>
                  <TableHead className="text-right">إجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isPending ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell>
                        <Skeleton className="h-10 w-10 rounded-lg" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-4 w-40" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-4 w-20" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-4 w-24" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-4 w-8" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-6 w-20 rounded-full" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-4 w-12" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-4 w-10" />
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2 justify-end">
                          <Skeleton className="h-8 w-8 rounded" />
                          <Skeleton className="h-8 w-8 rounded" />
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : products.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={9}
                      className="text-center py-10 text-muted-foreground"
                    >
                      لا توجد منتجات مطابقة
                    </TableCell>
                  </TableRow>
                ) : (
                  products.map((product) => {
                    const totalInventory =
                      product.variants?.reduce(
                        (s, v) => s + (v.inventory ?? 0),
                        0,
                      ) ?? 0;
                    const thumb = product.thumbnail ?? product.images?.[0]?.url;
                    return (
                      <TableRow key={product.id}>
                        <TableCell>
                          {thumb ? (
                            <div className="relative size-10 overflow-hidden rounded-md bg-muted">
                              <Image
                                src={thumb}
                                alt=""
                                fill
                                className="object-cover"
                                sizes="40px"
                              />
                            </div>
                          ) : (
                            <div className="size-10 rounded-md bg-muted" />
                          )}
                        </TableCell>
                        <TableCell className="font-medium">
                          {product.title}
                        </TableCell>
                        <TableCell className="align-top">
                          {product.categories &&
                          product.categories.length > 0 ? (
                            <span className="text-xs text-muted-foreground leading-snug line-clamp-2">
                              {product.categories.map((c) => c.name).join("، ")}
                            </span>
                          ) : (
                            <span className="text-muted-foreground text-xs">
                              —
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="text-muted-foreground text-sm font-mono">
                          {product.handle}
                        </TableCell>
                        <TableCell>{product.variants?.length ?? 0}</TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              product.status === "published"
                                ? "default"
                                : "outline"
                            }
                          >
                            {product.status === "published" ? "منشور" : "مسودة"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {product.adsBoosted ? (
                            <Badge variant="secondary" className="text-xs">
                              مروّج
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground text-xs">
                              —
                            </span>
                          )}
                        </TableCell>
                        <TableCell>{totalInventory}</TableCell>
                        <TableCell className="text-right space-x-1 rtl:space-x-reverse">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() =>
                              router.push(`/admin/products/${product.id}/edit`)
                            }
                            aria-label="تعديل"
                          >
                            <Edit className="size-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDuplicate(product)}
                            aria-label="نسخ المنتج"
                            title="نسخ المنتج"
                          >
                            <Copy className="size-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-destructive"
                            onClick={() => setDeleteId(product.id)}
                            aria-label="حذف"
                          >
                            <Trash2 className="size-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-1 py-3 border-t border-border mt-2">
              <p className="text-sm text-muted-foreground">
                الصفحة {adminPage} من {totalPages}
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  className="size-8"
                  disabled={adminPage === 1}
                  onClick={() => setAdminPage((p) => Math.max(1, p - 1))}
                  aria-label="الصفحة السابقة"
                >
                  <ChevronRight className="size-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className="size-8"
                  disabled={adminPage === totalPages}
                  onClick={() =>
                    setAdminPage((p) => Math.min(totalPages, p + 1))
                  }
                  aria-label="الصفحة التالية"
                >
                  <ChevronLeft className="size-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog
        open={deleteId !== null}
        onOpenChange={(open) => !open && setDeleteId(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>حذف هذا المنتج؟</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground leading-relaxed">
            سيتم حذف المنتج من المتجر نهائياً. لا يمكن التراجع عن هذا الإجراء.
          </p>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => setDeleteId(null)}
            >
              إلغاء
            </Button>
            <Button
              type="button"
              variant="destructive"
              disabled={deleteMutation.isPending}
              onClick={() => {
                if (deleteId) deleteMutation.mutate(deleteId);
              }}
            >
              حذف نهائي
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
