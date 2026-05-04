"use client"

import { Suspense, useTransition, useState } from "react"
import { useParams } from "next/navigation"
import { useQuery } from "@tanstack/react-query"
import Image from "next/image"
import { ProductGrid } from "@/components/blocks/commerce/product-grid"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Breadcrumb } from "@/components/ui/breadcrumb"
import type { AppProduct, AppCategory } from "@/lib/types"

const SORT_OPTIONS = [
  { value: "default", label: "الافتراضي" },
  { value: "created_at", label: "الأحدث" },
  { value: "price_asc", label: "السعر: من الأقل للأعلى" },
  { value: "price_desc", label: "السعر: من الأعلى للأقل" },
]

function CategoryContent() {
  const params = useParams()
  const slug = params.slug as string
  const [sort, setSort] = useState("default")
  const [, startTransition] = useTransition()

  const { data: categoryData } = useQuery<AppCategory | null>({
    queryKey: ["category", slug],
    queryFn: async () => {
      const res = await fetch("/api/categories")
      if (!res.ok) return null
      const categories: AppCategory[] = await res.json()
      return categories.find(c => c.handle === slug) ?? null
    },
    enabled: !!slug,
  })

  const { data: products = [], isPending } = useQuery<AppProduct[]>({
    queryKey: ["category-products", slug, sort],
    queryFn: async () => {
      if (!categoryData) return []
      const res = await fetch("/api/products?limit=200")
      if (!res.ok) return []
      const raw = await res.json()
      const all: AppProduct[] = Array.isArray(raw) ? raw : (raw.products ?? [])
      const result = all.filter(p => p.categories?.some(c => c.id === categoryData.id))

      if (sort === "created_at") {
        result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      }
      if (sort === "price_asc") {
        result.sort((a, b) => (a.variants?.[0]?.price ?? 0) - (b.variants?.[0]?.price ?? 0))
      }
      if (sort === "price_desc") {
        result.sort((a, b) => (b.variants?.[0]?.price ?? 0) - (a.variants?.[0]?.price ?? 0))
      }

      return result
    },
    enabled: !!categoryData,
  })

  const currencyCode = "tnd"

  // API returns `image` field; normalize to imageUrl
  const heroBanner = (categoryData as (AppCategory & { image?: string | null }) | null | undefined)?.image
    ?? categoryData?.imageUrl

  return (
    <div>
      {/* Hero banner */}
      {heroBanner && (
        <div className="relative h-48 w-full overflow-hidden sm:h-64 lg:h-72">
          <Image
            src={heroBanner}
            alt={categoryData?.name ?? ""}
            fill
            className="object-cover"
            priority
            sizes="100vw"
          />
          <div className="absolute inset-0 bg-black/40" />
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-4">
            <h1 className="text-3xl font-bold tracking-tight text-white drop-shadow sm:text-4xl">
              {categoryData?.name ?? "التصنيف"}
            </h1>
            <p className="text-white/80 mt-2 text-sm">
              {isPending ? "" : `${products.length} منتج`}
            </p>
          </div>
        </div>
      )}

      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <Breadcrumb
        className="mb-6"
        items={[
          { label: "الرئيسية", href: "/" },
          { label: categoryData?.name ?? "التصنيف" },
        ]}
      />
      {!heroBanner && (
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">
            {categoryData?.name ?? "التصنيف"}
          </h1>
          <p className="text-muted-foreground mt-2">
            {isPending ? "جاري التحميل..." : `${products.length} منتج في هذا التصنيف`}
          </p>
        </div>
      )}

      <div className="flex items-center justify-end mb-8 gap-2">
        <span className="text-sm text-muted-foreground">ترتيب حسب:</span>
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

        <ProductGrid products={products} isLoading={isPending} columns={4} currencyCode={currencyCode} />
      </div>
    </div>
  )
}

export default function CategoryPage() {
  return (
    <Suspense fallback={<div className="mx-auto max-w-7xl px-4 py-10 sm:px-6"><ProductGrid products={[]} isLoading columns={4} /></div>}>
      <CategoryContent />
    </Suspense>
  )
}
