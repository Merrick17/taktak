"use client"

import Image from "next/image"
import Link from "next/link"
import { useState } from "react"
import { Heart } from "lucide-react"
import { Card, CardContent, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useCart } from "@/hooks/use-cart"
import { useToast } from "@/hooks/use-toast"
import { useUiStore } from "@/stores/ui-store"
import { useInstantCheckoutStore } from "@/stores/instant-checkout-store"
import { formatPrice } from "@/lib/types"
import { cn } from "@/lib/utils"
import type { AppProduct } from "@/lib/types"
import { metaAddToCartParams, trackMetaEvent } from "@/lib/meta-pixel-client"

interface ProductCardOneProps {
  product: AppProduct
  currencyCode?: string
}

export function ProductCardOne({ product, currencyCode = "tnd" }: ProductCardOneProps) {
  const { addItem, isLoading } = useCart()
  const { toast } = useToast()
  const openCart = useUiStore((s) => s.openCart)
  const openInstantCheckout = useInstantCheckoutStore((s) => s.openInstantCheckout)
  const [adding, setAdding] = useState(false)
  const [favorited, setFavorited] = useState(false)

  const firstVariant = product.variants?.[0]
  const price = firstVariant?.price ?? 0
  const originalPrice = firstVariant?.calculated_price?.original_amount
  const discount =
    originalPrice && originalPrice > price
      ? Math.round(((originalPrice - price) / originalPrice) * 100)
      : null
  const thumbnail = product.thumbnail ?? product.images?.[0]?.url ?? null

  async function handleAddToCart(e: React.MouseEvent) {
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
    <Card className="w-full overflow-hidden group border-border/60 hover:border-border hover:shadow-md transition-all duration-200">
      <CardContent className="p-0">
        <div className="relative">
          <Link
            href={`/products/${product.handle}`}
            className="bg-muted flex items-center justify-center h-[260px] relative overflow-hidden block"
          >
            {thumbnail ? (
              <Image
                src={thumbnail}
                alt={product.title}
                fill
                className="object-cover transition-transform duration-500 group-hover:scale-105"
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
              />
            ) : (
              <div className="flex items-center justify-center h-full w-full text-muted-foreground/20">
                <svg className="size-16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="0.8">
                  <rect x="3" y="3" width="18" height="18" rx="2" />
                  <circle cx="8.5" cy="8.5" r="1.5" />
                  <path d="m21 15-5-5L5 21" />
                </svg>
              </div>
            )}
            {discount && (
              <div className="absolute top-2.5 start-2.5">
                <Badge className="bg-primary text-primary-foreground text-xs font-semibold">
                  -{discount}%
                </Badge>
              </div>
            )}
          </Link>
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-2 end-2 bg-background/80 backdrop-blur-sm rounded-full hover:bg-background shadow-sm"
            onClick={(e) => { e.preventDefault(); setFavorited(!favorited) }}
            aria-label="المفضلة"
          >
            <Heart
              className={cn(
                "w-4 h-4 transition-colors",
                favorited ? "fill-red-500 text-red-500" : "text-foreground/60 hover:text-red-500",
              )}
            />
          </Button>
        </div>

        <div className="p-4">
          <div className="mb-3">
            <CardTitle className="text-sm font-semibold leading-tight mb-1.5 line-clamp-2">
              <Link href={`/products/${product.handle}`} className="hover:underline">
                {product.title}
              </Link>
            </CardTitle>
            {product.description && (
              <CardDescription className="text-xs line-clamp-2 leading-relaxed">
                {product.description}
              </CardDescription>
            )}
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-1.5 flex-wrap">
              <p className="text-base font-bold">{formatPrice(price, currencyCode)}</p>
              {originalPrice && originalPrice > price && (
                <p className="text-xs text-muted-foreground line-through">
                  {formatPrice(originalPrice, currencyCode)}
                </p>
              )}
            </div>
            <div className="flex gap-2 shrink-0">
              <Button
                size="sm"
                variant="outline"
                type="button"
                onClick={handleBuyNow}
                disabled={adding || isLoading || !firstVariant}
                className="flex-1 sm:flex-none"
              >
                اشترِ الآن
              </Button>
              <Button
                size="sm"
                type="button"
                onClick={handleAddToCart}
                disabled={adding || isLoading || !firstVariant}
                className="flex-1 sm:flex-none"
              >
                {adding ? "..." : "أضف للسلة"}
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
