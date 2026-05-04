import type { Metadata } from "next"
import WishlistPageClient from "./_components/wishlist-content"

export const metadata: Metadata = {
  title: "قائمة الأمنيات — تكتك",
  description: "منتجاتك المحفوظة في قائمة الأمنيات.",
}

export default function WishlistPage() {
  return <WishlistPageClient />
}
