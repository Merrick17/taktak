import { HeroSection } from "@/components/blocks/marketing/hero-section"
import { FeaturedProductsSection } from "@/components/blocks/marketing/featured-products-section"
import { CategoryGridSection } from "@/components/blocks/marketing/category-grid-section"
import { PromoBannerSection } from "@/components/blocks/marketing/promo-banner-section"
import { ReviewsSection } from "@/components/blocks/marketing/reviews-section"
import type { AppCategory, AppProduct } from "@/lib/types"

function homeProductsFromPayload(payload: unknown): AppProduct[] {
  if (Array.isArray(payload)) return payload as AppProduct[]
  if (payload && typeof payload === "object" && "products" in payload) {
    const list = (payload as { products: unknown }).products
    return Array.isArray(list) ? (list as AppProduct[]) : []
  }
  return []
}

async function getCategoriesWithImages(): Promise<AppCategory[]> {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/categories`, {
      next: { tags: ["categories"] },
    })
    if (!res.ok) return []
    const categories: AppCategory[] = await res.json()
    return categories.slice(0, 6)
  } catch {
    return []
  }
}

export default async function HomePage() {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"

  const [productsRes, categories] = await Promise.all([
    fetch(`${baseUrl}/api/products?limit=4`, { next: { tags: ["products"] } })
      .then((r) => (r.ok ? r.json() : []))
      .catch(() => []),
    getCategoriesWithImages(),
  ])

  const products = homeProductsFromPayload(productsRes)
  const currencyCode = "tnd"

  return (
    <>
      <HeroSection />
      <FeaturedProductsSection products={products} currencyCode={currencyCode} />
      <CategoryGridSection categories={categories} />
      <ReviewsSection />
      <PromoBannerSection />
    </>
  )
}
