import type { Metadata } from "next"
import SearchPageClient from "./_components/search-content"

export const metadata: Metadata = {
  title: "البحث — تكتك",
  description: "ابحث عن منتجاتك المفضلة في متجر تكتك.",
}

export default function SearchPage() {
  return <SearchPageClient />
}
