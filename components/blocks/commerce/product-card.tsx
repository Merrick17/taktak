"use client"

import Image from "next/image"
import Link from "next/link"
import { useState } from "react"
import { useCart } from "@/hooks/use-cart"
import { useToast } from "@/hooks/use-toast"
import { useUiStore } from "@/stores/ui-store"
import { useInstantCheckoutStore } from "@/stores/instant-checkout-store"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { formatPrice } from "@/lib/types"
import type { AppProduct } from "@/lib/types"
import { metaAddToCartParams, trackMetaEvent } from "@/lib/meta-pixel-client"

interface ProductCardProps {
  product: AppProduct
  currencyCode?: string
}

export function ProductCard({ product, currencyCode = "tnd" }: ProductCardProps) {
  const { addItem, isLoading } = useCart()
  const { toast } = useToast()
  const openCart = useUiStore((s) => s.openCart)
  const openInstantCheckout = useInstantCheckoutStore((s) => s.openInstantCheckout)
  const [adding, setAdding] = useState(false)

  const firstVariant = product.variants?.[0]
  const price = firstVariant?.price ?? 0
  const originalPrice = firstVariant?.calculated_price?.original_amount
  const discount =
    originalPrice && originalPrice > price
      ? Math.round(((originalPrice - price) / originalPrice) * 100)
      : null

  async function handleQuickAdd(e: React.MouseEvent) {
    e.preventDefault()
    if (!firstVariant?.id) return
    setAdding(true)
    try {
      await addItem(firstVariant.id, 1)
      trackMetaEvent("AddToCart", metaAddToCartParams(product, firstVariant.price, 1))
      openCart()
    } catch (err) {
      const description = err instanceof Error ? err.message : "تعذر إضافة المنتج إلى السلة."
      toast({
        variant: "destructive",
        title: "تعذر إضافة المنتج",
        description,
      })
    } finally {
      setAdding(false)
    }
  }

  function handleBuyNow(e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    if (!firstVariant?.id) return
    openInstantCheckout(product, firstVariant.id, 1)
  }

  return (
    <div className="group relative flex flex-col">
      <Link
        href={`/products/${product.handle}`}
        className="relative block overflow-hidden rounded-xl bg-muted aspect-[3/4]"
      >
        {(product.thumbnail ?? product.images?.[0]?.url) && (
          <Image
            src={product.thumbnail ?? product.images![0].url}
            alt={product.title}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
          />
        )}

        <div className="absolute start-3 top-3 flex flex-col gap-1.5">
          {discount && (
            <Badge className="text-xs font-semibold bg-foreground text-background">
              -{discount}%
            </Badge>
          )}
        </div>

        {firstVariant && (
          <div className="absolute inset-x-3 bottom-3 translate-y-2 opacity-0 transition-all duration-200 group-hover:translate-y-0 group-hover:opacity-100 flex flex-col gap-2">
            <Button
              className="w-full"
              size="sm"
              variant="secondary"
              onClick={handleQuickAdd}
              disabled={adding || isLoading}
            >
              {adding ? "جاري الإضافة..." : "إضافة سريعة"}
            </Button>
            <Button
              className="w-full"
              size="sm"
              variant="outline"
              onClick={handleBuyNow}
              disabled={adding || isLoading}
            >
              اشترِ الآن
            </Button>
          </div>
        )}
      </Link>

      <div className="mt-3 flex flex-col gap-1">
        <Link href={`/products/${product.handle}`} className="text-sm font-medium leading-snug hover:underline line-clamp-2">
          {product.title}
        </Link>

        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold">{formatPrice(price, currencyCode)}</span>
          {originalPrice && originalPrice > price && (
            <span className="text-xs text-muted-foreground line-through">
              {formatPrice(originalPrice, currencyCode)}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
