"use client"

import { usePathname } from "next/navigation"
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { WhatsappSupportFab } from "@/components/layout/whatsapp-support-fab"
import { PromoBannerOne } from "@/components/promo-banner-01"
import type { AppCategory } from "@/lib/types"

interface StorefrontChromeProps {
  footerCategories: AppCategory[]
  socialSettings: Record<string, string>
}

export function StorefrontChrome({
  footerCategories,
  socialSettings,
}: StorefrontChromeProps) {
  const pathname = usePathname()

  // Don't render storefront chrome on admin pages
  if (pathname.startsWith("/admin")) {
    return null
  }

  return (
    <>
      <PromoBannerOne />
      <Header />
      <WhatsappSupportFab />
    </>
  )
}
