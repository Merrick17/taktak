"use client"

import { Suspense } from "react"
import { useQuery } from "@tanstack/react-query"
import { ProductGrid } from "@/components/blocks/commerce/product-grid"
import type { AppProduct } from "@/lib/types"

function WishlistContent() {
  const { data: products = [], isPending } = useQuery<AppProduct[]>({
    queryKey: ["products-wishlist"],
    queryFn: async () => {
      const wishlist = JSON.parse(localStorage.getItem("wishlist") ?? "[]")
      if (wishlist.length === 0) return []

      const res = await fetch("/api/products?limit=200")
      if (!res.ok) return []
      const data = await res.json()
      const all: AppProduct[] = Array.isArray(data) ? data : (data.products ?? [])
      return all.filter(p => wishlist.includes(p.id))
    },
  })

  const currencyCode = "tnd"

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <h1 className="text-3xl font-bold tracking-tight mb-10">قائمة الأمنيات</h1>

      {products.length === 0 && !isPending && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <p className="text-lg font-medium">قائمة الأمنيات فارغة</p>
          <p className="text-muted-foreground mt-2">أضف المنتجات التي تعجبك للرجوع إليها لاحقاً.</p>
        </div>
      )}

      <ProductGrid products={products} isLoading={isPending} columns={4} currencyCode={currencyCode} />
    </div>
  )
}

export default function WishlistPageClient() {
  return (
    <Suspense fallback={<div className="mx-auto max-w-7xl px-4 py-10 sm:px-6"><ProductGrid products={[]} isLoading columns={4} /></div>}>
      <WishlistContent />
    </Suspense>
  )
}
