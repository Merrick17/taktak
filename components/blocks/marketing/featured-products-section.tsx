import Link from "next/link"
import { ProductGrid } from "@/components/blocks/commerce/product-grid"
import { Button } from "@/components/ui/button"
import type { AppProduct } from "@/lib/types"

interface FeaturedProductsSectionProps {
  products: AppProduct[]
  isLoading?: boolean
  currencyCode?: string
}

export function FeaturedProductsSection({ products, isLoading, currencyCode }: FeaturedProductsSectionProps) {
  return (
    <section className="py-16 sm:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="flex items-end justify-between mb-10">
          <div>
            <p className="text-xs font-medium tracking-widest text-muted-foreground uppercase mb-2">
              مختارة لك
            </p>
            <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">منتجات مميزة</h2>
          </div>
          <Button variant="outline" size="sm" asChild className="hidden sm:flex">
            <Link href="/products">عرض الكل</Link>
          </Button>
        </div>

        <ProductGrid products={products} isLoading={isLoading} columns={4} currencyCode={currencyCode} />

        <div className="mt-10 flex justify-center sm:hidden">
          <Button variant="outline" asChild>
            <Link href="/products">عرض جميع المنتجات</Link>
          </Button>
        </div>
      </div>
    </section>
  )
}
