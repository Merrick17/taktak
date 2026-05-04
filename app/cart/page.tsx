"use client"

import Image from "next/image"
import Link from "next/link"
import { useCart, CART_FETCH_FAILED, CART_FORBIDDEN, CART_NOT_FOUND } from "@/hooks/use-cart"
import { OrderSummary } from "@/components/blocks/commerce/order-summary"
import { PromoCodeField } from "@/components/blocks/commerce/promo-code-field"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { formatPrice } from "@/lib/types"

export default function CartPage() {
  const {
    cart,
    cartId,
    isLoading,
    isCartDataLoading,
    isCartQueryError,
    cartQueryError,
    isCreatingCart,
    refreshCart,
    updateItem,
    removeItem,
  } = useCart()

  const errMsg = cartQueryError instanceof Error ? cartQueryError.message : ""
  const isAutoRecovering =
    isCartQueryError && (errMsg === CART_FORBIDDEN || errMsg === CART_NOT_FOUND)

  const showFullSkeleton =
    isCartDataLoading || isAutoRecovering || (!cartId && isCreatingCart)

  if (showFullSkeleton) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
        <Skeleton className="h-9 w-24 mb-10" />
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex gap-5 py-6 border-b border-border">
                <Skeleton className="h-24 w-20 rounded-xl shrink-0" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/3" />
                  <div className="flex items-center justify-between mt-4">
                    <Skeleton className="h-9 w-24 rounded-lg" />
                    <Skeleton className="h-5 w-16" />
                  </div>
                </div>
              </div>
            ))}
            <div className="mt-6">
              <Skeleton className="h-9 w-36 rounded-lg" />
            </div>
          </div>
          <div className="space-y-4">
            <Skeleton className="h-10 w-full rounded-lg" />
            <div className="rounded-xl border border-border p-6 space-y-3">
              <Skeleton className="h-5 w-28 mb-4" />
              {[...Array(3)].map((_, i) => (
                <div key={i} className="flex justify-between">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-16" />
                </div>
              ))}
              <div className="border-t pt-3 flex justify-between">
                <Skeleton className="h-5 w-20" />
                <Skeleton className="h-5 w-20" />
              </div>
              <Skeleton className="h-11 w-full rounded-lg mt-2" />
              <Skeleton className="h-9 w-full rounded-lg" />
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (isCartQueryError && !isAutoRecovering) {
    const isServer = errMsg === CART_FETCH_FAILED
    return (
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
        <h1 className="text-3xl font-bold tracking-tight mb-8">سلتك</h1>
        <div className="mx-auto max-w-md rounded-xl border border-border bg-muted/30 p-8 text-center">
          <p className="font-medium text-foreground">
            {isServer ? "تعذر تحميل السلة من الخادم." : "حدث خطأ أثناء تحميل السلة."}
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            يمكنك إعادة تهيئة السلة والمحاولة مرة أخرى.
          </p>
          <Button className="mt-6 w-full" type="button" onClick={() => void refreshCart()} disabled={isLoading}>
            إعادة تهيئة السلة
          </Button>
          <Button variant="link" className="mt-2" asChild>
            <Link href="/products">تصفح المنتجات</Link>
          </Button>
        </div>
      </div>
    )
  }

  if (!cartId && !isCreatingCart) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
        <h1 className="text-3xl font-bold tracking-tight mb-8">سلتك</h1>
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <p className="text-muted-foreground mb-4">السلة غير جاهزة بعد.</p>
          <Button type="button" onClick={() => void refreshCart()} disabled={isLoading}>
            إعادة تهيئة السلة
          </Button>
        </div>
      </div>
    )
  }

  if (!cart) {
    return null
  }

  const items = cart.items ?? []
  const currencyCode = cart.currency_code ?? "tnd"

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
        <h1 className="text-3xl font-bold tracking-tight mb-12">سلتك</h1>
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <svg className="size-20 text-muted-foreground/20 mb-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
            <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
            <line x1="3" y1="6" x2="21" y2="6" />
            <path d="M16 10a4 4 0 0 1-8 0" />
          </svg>
          <h2 className="text-xl font-semibold mb-2">سلتك فارغة</h2>
          <p className="text-muted-foreground mb-6">لم تضف أي منتجات بعد.</p>
          <Button asChild><Link href="/products">ابدأ التسوق</Link></Button>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <h1 className="text-3xl font-bold tracking-tight mb-10">سلتك</h1>

      <div className="grid grid-cols-1 gap-10 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <div className="divide-y divide-border">
            {items.map((item: { id: string; title?: string; quantity: number; unitPrice?: number; unit_price?: number; thumbnail?: string | null }) => (
              <div key={item.id} className="flex gap-5 py-6">
                <div className="relative h-24 w-20 shrink-0 overflow-hidden rounded-xl bg-muted">
                  {item.thumbnail && (
                    <Image src={item.thumbnail} alt={item.title ?? ""} fill className="object-cover" sizes="80px" />
                  )}
                </div>

                <div className="flex flex-1 flex-col gap-2">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <Link href="/products" className="font-medium hover:underline">
                        {item.title}
                      </Link>
                    </div>
                    <button type="button" onClick={() => removeItem(item.id)} disabled={isLoading} className="text-muted-foreground hover:text-foreground transition-colors">
                      <svg className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                      </svg>
                    </button>
                  </div>

                  <div className="flex items-center justify-between mt-auto">
                    <div className="flex items-center rounded-md border border-border">
                      <button type="button" onClick={() => updateItem(item.id, item.quantity - 1)} disabled={isLoading} className="flex size-9 items-center justify-center text-muted-foreground hover:text-foreground transition-colors disabled:opacity-40">−</button>
                      <span className="w-10 text-center text-sm font-medium">{item.quantity}</span>
                      <button type="button" onClick={() => updateItem(item.id, item.quantity + 1)} disabled={isLoading} className="flex size-9 items-center justify-center text-muted-foreground hover:text-foreground transition-colors disabled:opacity-40">+</button>
                    </div>
                    <span className="font-semibold">
                      {formatPrice((item.unitPrice ?? item.unit_price ?? 0) * item.quantity, currencyCode)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-6">
            <Button variant="outline" asChild><Link href="/products">مواصلة التسوق</Link></Button>
          </div>
        </div>

        <div className="lg:col-span-1 space-y-4">
          <PromoCodeField />
          <OrderSummary cart={cart} />
          <Button size="lg" className="w-full pb-[max(0.5rem,env(safe-area-inset-bottom))]" asChild>
            <Link href="/checkout">إتمام الطلب</Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
