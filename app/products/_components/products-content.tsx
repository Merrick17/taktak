"use client"

import { Suspense, useTransition, useState, useMemo } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { useQuery } from "@tanstack/react-query"
import { ProductGrid } from "@/components/blocks/commerce/product-grid"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { SlidersHorizontal, X } from "lucide-react"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { formatPrice } from "@/lib/types"
import type { AppProduct, AppCategory, AppVariant } from "@/lib/types"

const SORT_OPTIONS = [
  { value: "default", label: "الافتراضي" },
  { value: "created_at", label: "الأحدث" },
  { value: "price_asc", label: "السعر: من الأقل للأعلى" },
  { value: "price_desc", label: "السعر: من الأعلى للأقل" },
]

function getVariantPrice(p: AppProduct) {
  return p.variants?.[0]?.price ?? 0
}

function FilterPanel({
  products,
  categories,
  categoryHandle,
  minPrice,
  maxPrice,
  inStockOnly,
  onCategoryChange,
  onMinChange,
  onMaxChange,
  onInStockChange,
  onReset,
}: {
  products: AppProduct[]
  categories: AppCategory[]
  categoryHandle: string | undefined
  minPrice: string
  maxPrice: string
  inStockOnly: boolean
  onCategoryChange: (h: string | undefined) => void
  onMinChange: (v: string) => void
  onMaxChange: (v: string) => void
  onInStockChange: (v: boolean) => void
  onReset: () => void
}) {
  const prices = products.map(getVariantPrice).filter((p) => p > 0)
  const globalMin = prices.length ? Math.floor(Math.min(...prices)) : 0
  const globalMax = prices.length ? Math.ceil(Math.max(...prices)) : 9999

  return (
    <div className="space-y-6 text-sm">
      <div className="flex items-center justify-between">
        <span className="font-semibold text-base">فلترة</span>
        <Button variant="ghost" size="sm" className="h-7 text-xs gap-1" onClick={onReset}>
          <X className="size-3" /> إعادة ضبط
        </Button>
      </div>

      {/* Category */}
      <div className="space-y-2">
        <p className="font-medium">الفئة</p>
        <div className="flex flex-col gap-1.5">
          <button
            onClick={() => onCategoryChange(undefined)}
            className={`text-start rounded px-2 py-1.5 transition-colors ${!categoryHandle ? "bg-foreground text-background" : "hover:bg-muted"}`}
          >
            الكل
          </button>
          {categories.map((c) => (
            <button
              key={c.id}
              onClick={() => onCategoryChange(c.handle)}
              className={`text-start rounded px-2 py-1.5 transition-colors ${categoryHandle === c.handle ? "bg-foreground text-background" : "hover:bg-muted"}`}
            >
              {c.name}
            </button>
          ))}
        </div>
      </div>

      {/* Price range */}
      <div className="space-y-2">
        <p className="font-medium">نطاق السعر</p>
        <p className="text-xs text-muted-foreground">
          {formatPrice(globalMin)} — {formatPrice(globalMax)}
        </p>
        <div className="flex items-center gap-2">
          <Input
            type="number"
            min={0}
            placeholder="من"
            value={minPrice}
            onChange={(e) => onMinChange(e.target.value)}
            className="h-8 text-sm w-full"
          />
          <span className="text-muted-foreground">–</span>
          <Input
            type="number"
            min={0}
            placeholder="إلى"
            value={maxPrice}
            onChange={(e) => onMaxChange(e.target.value)}
            className="h-8 text-sm w-full"
          />
        </div>
      </div>

      {/* In-stock */}
      <div className="flex items-center gap-2">
        <Checkbox id="instock" checked={inStockOnly} onCheckedChange={(c) => onInStockChange(c === true)} />
        <Label htmlFor="instock" className="cursor-pointer">متوفر فقط</Label>
      </div>
    </div>
  )
}

function ProductsContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [sort, setSort] = useState("default")
  const [, startTransition] = useTransition()
  const [minPrice, setMinPrice] = useState("")
  const [maxPrice, setMaxPrice] = useState("")
  const [inStockOnly, setInStockOnly] = useState(false)
  const [categoryHandle, setCategoryHandle] = useState<string | undefined>(searchParams.get("category") ?? undefined)
  const [filterOpen, setFilterOpen] = useState(false)

  const { data: allProducts = [], isPending } = useQuery<AppProduct[]>({
    queryKey: ["products-all"],
    queryFn: async () => {
      const res = await fetch("/api/products?limit=200")
      if (!res.ok) return []
      const data = await res.json()
      return Array.isArray(data) ? data : (data.products ?? [])
    },
  })

  const { data: categories = [] } = useQuery<AppCategory[]>({
    queryKey: ["categories"],
    queryFn: async () => {
      const res = await fetch("/api/categories")
      if (!res.ok) return []
      return res.json()
    },
    staleTime: 5 * 60 * 1000,
  })

  function handleCategoryChange(h: string | undefined) {
    setCategoryHandle(h)
    const params = new URLSearchParams(searchParams.toString())
    if (h) params.set("category", h)
    else params.delete("category")
    router.replace(`/products?${params.toString()}`)
    setFilterOpen(false)
  }

  function handleReset() {
    setCategoryHandle(undefined)
    setMinPrice("")
    setMaxPrice("")
    setInStockOnly(false)
    router.replace("/products")
    setFilterOpen(false)
  }

  const products = useMemo(() => {
    let result = [...allProducts]

    if (categoryHandle) {
      result = result.filter((p) => p.categories?.some((c) => c.handle === categoryHandle))
    }

    const min = minPrice !== "" ? parseFloat(minPrice) : null
    const max = maxPrice !== "" ? parseFloat(maxPrice) : null
    if (min !== null) result = result.filter((p) => getVariantPrice(p) >= min)
    if (max !== null) result = result.filter((p) => getVariantPrice(p) <= max)

    if (inStockOnly) {
      result = result.filter((p) => p.variants?.some((v: AppVariant) => (v.inventory ?? 0) > 0))
    }

    if (sort === "created_at") result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    if (sort === "price_asc") result.sort((a, b) => getVariantPrice(a) - getVariantPrice(b))
    if (sort === "price_desc") result.sort((a, b) => getVariantPrice(b) - getVariantPrice(a))

    return result
  }, [allProducts, categoryHandle, minPrice, maxPrice, inStockOnly, sort])

  const hasActiveFilters = !!categoryHandle || minPrice !== "" || maxPrice !== "" || inStockOnly
  const currencyCode = "tnd"

  const filterProps = {
    products: allProducts,
    categories,
    categoryHandle,
    minPrice,
    maxPrice,
    inStockOnly,
    onCategoryChange: handleCategoryChange,
    onMinChange: (v: string) => startTransition(() => setMinPrice(v)),
    onMaxChange: (v: string) => startTransition(() => setMaxPrice(v)),
    onInStockChange: (v: boolean) => startTransition(() => setInStockOnly(v)),
    onReset: handleReset,
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <div className="mb-8 flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">جميع المنتجات</h1>
          <p className="text-muted-foreground mt-2">
            {isPending ? "جاري التحميل..." : `${products.length} منتج`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* Mobile filter trigger */}
          <Sheet open={filterOpen} onOpenChange={setFilterOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2 md:hidden">
                <SlidersHorizontal className="size-4" />
                فلترة
                {hasActiveFilters && <span className="flex size-4 items-center justify-center rounded-full bg-primary text-[10px] text-primary-foreground font-bold">!</span>}
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-72 overflow-y-auto">
              <SheetHeader><SheetTitle>فلترة</SheetTitle></SheetHeader>
              <div className="mt-6 px-2">
                <FilterPanel {...filterProps} />
              </div>
            </SheetContent>
          </Sheet>

          <Select value={sort} onValueChange={(v) => startTransition(() => setSort(v))}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SORT_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex gap-8">
        {/* Desktop sidebar */}
        <aside className="hidden md:block w-56 shrink-0">
          <div className="sticky top-24">
            <FilterPanel {...filterProps} />
          </div>
        </aside>

        {/* Grid */}
        <div className="flex-1 min-w-0">
          <ProductGrid products={products} isLoading={isPending} columns={3} currencyCode={currencyCode} />
        </div>
      </div>
    </div>
  )
}

export default function ProductsPageClient() {
  return (
    <Suspense fallback={<div className="mx-auto max-w-7xl px-4 py-10 sm:px-6"><ProductGrid products={[]} isLoading columns={4} /></div>}>
      <ProductsContent />
    </Suspense>
  )
}
