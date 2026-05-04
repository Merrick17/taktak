import Link from "next/link"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"
import { CategoryCard } from "@/components/category-01"
import type { AppCategory } from "@/lib/types"

interface CategoryGridSectionProps {
  categories: AppCategory[]
  isLoading?: boolean
}

export function CategoryGridSection({ categories, isLoading }: CategoryGridSectionProps) {
  return (
    <section className="py-16 sm:py-20 bg-muted/20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="flex items-end justify-between mb-10">
          <div>
            <p className="text-xs font-medium tracking-widest text-muted-foreground uppercase mb-2">
              تصفح حسب الفئة
            </p>
            <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">تسوق المجموعة</h2>
          </div>
          <Button variant="outline" size="sm" asChild className="hidden sm:flex">
            <Link href="/products">عرض الكل</Link>
          </Button>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="relative h-56 w-full rounded-xl overflow-hidden bg-muted animate-pulse">
                <div className="absolute bottom-4 start-4 space-y-1.5">
                  <Skeleton className="h-7 w-36" />
                  <Skeleton className="h-4 w-28" />
                </div>
              </div>
            ))}
          </div>
        ) : categories.length > 0 ? (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {categories.map((cat) => (
              <Link key={cat.id} href={`/category/${cat.handle}`}>
                <CategoryCard
                  title={cat.name}
                  count="تصفح المنتجات"
                  imageSrc={cat.image ?? cat.imageUrl ?? "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?q=80&w=1740&auto=format&fit=crop"}
                />
              </Link>
            ))}
          </div>
        ) : null}
      </div>
    </section>
  )
}
