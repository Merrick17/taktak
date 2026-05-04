"use client"

import { Suspense, useTransition, useState, useEffect } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { useQuery } from "@tanstack/react-query"
import Link from "next/link"
import { ProductGrid } from "@/components/blocks/commerce/product-grid"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Breadcrumb } from "@/components/ui/breadcrumb"
import { Search } from "lucide-react"
import type { AppProduct } from "@/lib/types"

function SearchContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [, startTransition] = useTransition()

  const urlQuery = searchParams.get("q") ?? ""
  const [inputValue, setInputValue] = useState(urlQuery)

  useEffect(() => {
    setInputValue(urlQuery)
  }, [urlQuery])

  const { data: products = [], isPending } = useQuery<AppProduct[]>({
    queryKey: ["products", "search", urlQuery],
    queryFn: async () => {
      if (!urlQuery) return []
      const res = await fetch("/api/products?limit=200")
      if (!res.ok) return []
      const raw = await res.json()
      const all: AppProduct[] = Array.isArray(raw) ? raw : (raw.products ?? [])
      const q = urlQuery.toLowerCase()
      return all.filter(
        (p) =>
          p.title.toLowerCase().includes(q) ||
          p.description?.toLowerCase().includes(q) ||
          p.handle.toLowerCase().includes(q)
      )
    },
    enabled: !!urlQuery,
  })

  const currencyCode = "tnd"

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    const q = inputValue.trim()
    if (!q) return
    startTransition(() => {
      const params = new URLSearchParams()
      params.set("q", q)
      router.push(`/search?${params.toString()}`)
    })
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <Breadcrumb
        className="mb-6"
        items={[
          { label: "الرئيسية", href: "/" },
          { label: urlQuery ? `نتائج: "${urlQuery}"` : "البحث" },
        ]}
      />
      <div className="mb-10 space-y-6">
        <h1 className="text-3xl font-bold tracking-tight">نتائج البحث</h1>
        <form onSubmit={handleSearch} className="flex gap-2 max-w-2xl">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="بحث عن منتجات..."
              className="pl-10"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              autoFocus
            />
          </div>
          <Button type="submit">بحث</Button>
        </form>
        {urlQuery && (
          <p className="text-muted-foreground">
            {isPending ? "جاري البحث..." : `${products.length} نتيجة لـ "${urlQuery}"`}
          </p>
        )}
        {!urlQuery && (
          <p className="text-muted-foreground">أدخل كلمة للبحث عن المنتجات.</p>
        )}
      </div>

      {urlQuery && products.length === 0 && !isPending && (
        <div className="flex flex-col items-center justify-center py-20 text-center gap-4">
          <Search className="size-12 text-muted-foreground/30" />
          <p className="text-lg font-medium">لا توجد نتائج لـ &quot;{urlQuery}&quot;</p>
          <p className="text-sm text-muted-foreground">جرّب كلمات مختلفة أو تصفح فئاتنا</p>
          <Button variant="outline" asChild>
            <Link href="/products">تصفح جميع المنتجات</Link>
          </Button>
        </div>
      )}

      {urlQuery && (products.length > 0 || isPending) && (
        <ProductGrid products={products} isLoading={isPending} columns={4} currencyCode={currencyCode} />
      )}
    </div>
  )
}

export default function SearchPageClient() {
  return (
    <Suspense fallback={<div className="mx-auto max-w-7xl px-4 py-10 sm:px-6"><ProductGrid products={[]} isLoading columns={4} /></div>}>
      <SearchContent />
    </Suspense>
  )
}
