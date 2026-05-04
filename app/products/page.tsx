import type { Metadata } from "next"
import ProductsPageClient from "./_components/products-content"

export const metadata: Metadata = {
  title: "جميع المنتجات — تكتك",
  description: "تصفح مجموعتنا الكاملة من المنتجات المختارة بعناية.",
}

export default function ProductsPage() {
  return <ProductsPageClient />
}
