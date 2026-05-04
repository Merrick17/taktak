"use client"

import { use } from "react"
import { useQuery } from "@tanstack/react-query"
import { Loader2 } from "lucide-react"
import { ProductForm, type ProductFormData } from "../../_components/product-form"

export default function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)

  const { data: product, isPending, error } = useQuery({
    queryKey: ["admin-product", id],
    queryFn: async () => {
      const res = await fetch(`/api/products/${id}`, { credentials: "include" })
      if (!res.ok) throw new Error("Failed to fetch product")
      return res.json()
    },
  })

  if (isPending) {
    return (
      <div className="flex justify-center py-24">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (error || !product) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-2">
        <p className="text-destructive font-medium">لم يتم العثور على المنتج</p>
        <p className="text-sm text-muted-foreground">{error?.message ?? "حدث خطأ أثناء تحميل المنتج."}</p>
      </div>
    )
  }

  const initial: ProductFormData = {
    title: product.title ?? "",
    description: product.description ?? "",
    handle: product.handle ?? "",
    status: product.status ?? "draft",
    adsBoosted: product.adsBoosted ?? false,
    categoryIds: (product.categories ?? []).map((c: { id: string }) => c.id),
    images: (product.images ?? []).map((img: { url: string; alt?: string }) => ({
      url: img.url,
      alt: img.alt ?? undefined,
    })),
    variants: (product.variants ?? []).map((v: { id?: string; title?: string | null; sku: string; price: number; inventory: number; options?: { name: string; value: string }[] }) => ({
      id: v.id,
      title: v.title ?? "",
      sku: v.sku ?? "",
      price: Number(v.price) ?? 0,
      inventory: Number(v.inventory) ?? 0,
      options: v.options ?? [],
    })),
  }

  return <ProductForm productId={id} initial={initial} isEdit />
}
