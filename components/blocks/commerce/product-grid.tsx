import { ProductCardOne } from "@/components/product-card-01"
import { Skeleton } from "@/components/ui/skeleton"
import type { AppProduct } from "@/lib/types"

interface ProductGridProps {
  products: AppProduct[]
  isLoading?: boolean
  columns?: 2 | 3 | 4
  currencyCode?: string
}

function ProductCardSkeleton() {
  return (
    <div className="flex flex-col gap-3">
      <Skeleton className="h-[260px] w-full rounded-xl" />
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-5 w-1/3" />
    </div>
  )
}

const COLUMN_CLASSES: Record<number, string> = {
  2: "grid-cols-1 sm:grid-cols-2",
  3: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
  4: "grid-cols-2 sm:grid-cols-2 lg:grid-cols-4",
}

export function ProductGrid({ products, isLoading, columns = 4, currencyCode }: ProductGridProps) {
  const colClass = COLUMN_CLASSES[columns] ?? COLUMN_CLASSES[4]

  if (isLoading) {
    return (
      <div className={`grid gap-4 ${colClass}`}>
        {[...Array(8)].map((_, i) => <ProductCardSkeleton key={i} />)}
      </div>
    )
  }

  if (products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <p className="text-lg font-medium">لا توجد منتجات</p>
        <p className="text-sm text-muted-foreground mt-2">جرب تعديل الفلاتر</p>
      </div>
    )
  }

  return (
    <div className={`grid gap-4 ${colClass}`}>
      {products.map((product) => (
        <ProductCardOne key={product.id} product={product} currencyCode={currencyCode} />
      ))}
    </div>
  )
}
