"use client"

import { useEffect, useRef } from "react"
import Link from "next/link"
import { useCart } from "@/hooks/use-cart"
import { CheckoutForm } from "@/components/blocks/commerce/checkout-form"
import { OrderSummary } from "@/components/blocks/commerce/order-summary"
import { PromoCodeField } from "@/components/blocks/commerce/promo-code-field"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { metaInitiateCheckoutParams, trackMetaEvent } from "@/lib/meta-pixel-client"
import type { AppCartItem } from "@/lib/types"

export default function CheckoutPage() {
  const { cart } = useCart()
  const initiatedCheckoutTracked = useRef(false)

  useEffect(() => {
    if (!cart?.items?.length || initiatedCheckoutTracked.current) return
    initiatedCheckoutTracked.current = true
    const items = cart.items.map((i: AppCartItem) => ({
      productId: i.productId,
      quantity: i.quantity,
      unitPrice: Number(i.unitPrice),
    }))
    trackMetaEvent("InitiateCheckout", metaInitiateCheckoutParams(items, Number(cart.total), "TND"))
  }, [cart])

  if (!cart) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 mb-8">
          <Skeleton className="h-3 w-16" />
          <Skeleton className="h-3 w-2" />
          <Skeleton className="h-3 w-20" />
        </div>
        <Skeleton className="h-9 w-48 mb-10" />
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-5">
          {/* Form side */}
          <div className="lg:col-span-3 space-y-5">
            <Skeleton className="h-5 w-32 mb-2" />
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Skeleton className="h-3 w-16" />
                <Skeleton className="h-10 w-full rounded-lg" />
              </div>
              <div className="space-y-1.5">
                <Skeleton className="h-3 w-16" />
                <Skeleton className="h-10 w-full rounded-lg" />
              </div>
            </div>
            {[...Array(3)].map((_, i) => (
              <div key={i} className="space-y-1.5">
                <Skeleton className="h-3 w-24" />
                <Skeleton className="h-10 w-full rounded-lg" />
              </div>
            ))}
            <div className="space-y-1.5">
              <Skeleton className="h-3 w-28" />
              <Skeleton className="h-20 w-full rounded-lg" />
            </div>
          </div>
          {/* Summary side */}
          <div className="lg:col-span-2 lg:sticky lg:top-24 space-y-4">
            <Skeleton className="h-10 w-full rounded-lg" />
            <Skeleton className="h-64 w-full rounded-xl" />
          </div>
        </div>
      </div>
    )
  }

  if ((cart.items?.length ?? 0) === 0) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <h2 className="text-xl font-semibold mb-2">سلتك فارغة</h2>
          <p className="text-muted-foreground mb-6">أضف منتجات قبل إتمام الطلب.</p>
          <Button asChild><Link href="/products">تسوق الآن</Link></Button>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-8">
        <Link href="/cart" className="hover:text-foreground transition-colors">السلة</Link>
        <span>/</span>
        <span className="text-foreground font-medium">الدفع</span>
      </nav>

      <h1 className="text-3xl font-bold tracking-tight mb-10">إتمام الطلب</h1>

      <div className="grid grid-cols-1 gap-12 lg:grid-cols-5">
        <div className="lg:col-span-3">
          <CheckoutForm />
        </div>
        <div className="lg:col-span-2">
          <div className="lg:sticky lg:top-24 space-y-4">
            <PromoCodeField />
            <OrderSummary cart={cart} />
          </div>
        </div>
      </div>
    </div>
  )
}
