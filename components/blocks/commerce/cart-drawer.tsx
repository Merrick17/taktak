"use client"

import Image from "next/image"
import Link from "next/link"
import { useCart, CART_FORBIDDEN, CART_NOT_FOUND } from "@/hooks/use-cart"
import { useToast } from "@/hooks/use-toast"
import { useUiStore } from "@/stores/ui-store"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetClose } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import {
  getCartItemCount,
  getCartTotal,
  getCartSubtotal,
  getCartDiscount,
  getCartShippingFee,
  formatPrice,
} from "@/lib/types"
import type { CartLineItem } from "@/lib/types"

interface CartItemRowProps {
  item: CartLineItem
  currencyCode: string
}

function CartItemRow({ item, currencyCode }: CartItemRowProps) {
  const { updateItem, removeItem, isLoading } = useCart()
  const { toast } = useToast()
  const unitPrice = item.unitPrice ?? item.unit_price ?? 0

  async function handleRemove() {
    try {
      await removeItem(item.id)
    } catch (err) {
      const description = err instanceof Error ? err.message : "تعذر حذف المنتج."
      toast({ variant: "destructive", title: "تعذر الحذف", description })
    }
  }

  async function handleQtyChange(nextQty: number) {
    if (nextQty < 1) return
    try {
      await updateItem(item.id, nextQty)
    } catch (err) {
      const description = err instanceof Error ? err.message : "تعذر تحديث الكمية."
      toast({ variant: "destructive", title: "تعذر التحديث", description })
    }
  }

  return (
    <div className="flex gap-4 py-4">
      {/* Thumbnail */}
      <div className="relative h-20 w-16 shrink-0 overflow-hidden rounded-lg bg-muted">
        {item.thumbnail ? (
          <Image
            src={item.thumbnail}
            alt={item.product_title ?? item.title ?? ""}
            fill
            className="object-cover"
            sizes="64px"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-muted-foreground/30">
            <svg className="size-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <path d="m21 15-5-5L5 21" />
            </svg>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex flex-1 flex-col gap-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <Link
              href={`/products/${item.product_handle ?? ""}`}
              className="text-sm font-medium leading-tight hover:underline line-clamp-2"
            >
              {item.product_title ?? item.title ?? ""}
            </Link>
            {item.variant_title && item.variant_title !== "Default Title" && (
              <p className="text-xs text-muted-foreground mt-0.5">{item.variant_title}</p>
            )}
          </div>
          <button
            type="button"
            onClick={() => void handleRemove()}
            disabled={isLoading}
            className="shrink-0 text-muted-foreground hover:text-destructive transition-colors p-0.5 disabled:opacity-50"
            aria-label="حذف"
          >
            <svg className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <div className="flex items-center justify-between mt-auto pt-1">
          {/* Quantity stepper */}
          <div className="flex items-center rounded-lg border border-border overflow-hidden">
            <button
              type="button"
              onClick={() => void handleQtyChange(item.quantity - 1)}
              disabled={isLoading || item.quantity <= 1}
              className="flex size-7 items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors text-base disabled:opacity-40"
              aria-label="تقليل"
            >
              −
            </button>
            <span className="w-8 text-center text-sm font-medium tabular-nums">{item.quantity}</span>
            <button
              type="button"
              onClick={() => void handleQtyChange(item.quantity + 1)}
              disabled={isLoading}
              className="flex size-7 items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors text-base disabled:opacity-40"
              aria-label="زيادة"
            >
              +
            </button>
          </div>
          <span className="text-sm font-semibold text-foreground">
            {formatPrice(unitPrice * item.quantity, currencyCode)}
          </span>
        </div>
      </div>
    </div>
  )
}

export function CartDrawer() {
  const {
    cart,
    cartId,
    isLoading,
    isCartDataLoading,
    isCartQueryError,
    cartQueryError,
    isCreatingCart,
    refreshCart,
  } = useCart()
  const cartOpen = useUiStore((s) => s.cartOpen)
  const closeCart = useUiStore((s) => s.closeCart)

  const errMsg = cartQueryError instanceof Error ? cartQueryError.message : ""
  const isAutoRecovering =
    isCartQueryError && (errMsg === CART_FORBIDDEN || errMsg === CART_NOT_FOUND)

  const showFullSkeleton =
    isCartDataLoading || isAutoRecovering || (!cartId && isCreatingCart)

  const itemCount = getCartItemCount(cart)
  const subtotal = getCartSubtotal(cart)
  const discount = getCartDiscount(cart)
  const total = getCartTotal(cart)
  const shippingFee = getCartShippingFee(cart)
  const currencyCode = cart?.currency_code ?? "tnd"
  const items = (cart?.items ?? []) as CartLineItem[]

  return (
    /* side="left" so the drawer slides in from the left (logical END in RTL) */
    <Sheet open={cartOpen} onOpenChange={(open) => !open && closeCart()}>
      <SheetContent side="left" className="flex w-full flex-col sm:max-w-md p-0">
        {/* Header */}
        <SheetHeader className="flex flex-row items-center justify-between px-6 py-4 border-b border-border shrink-0">
          <SheetTitle className="text-base font-semibold">
            السلة{" "}
            <span className="text-muted-foreground font-normal tabular-nums" aria-live="polite" aria-atomic="true">
              {itemCount > 0 ? `(${itemCount})` : ""}
            </span>
          </SheetTitle>
          <SheetClose asChild>
            <button className="text-muted-foreground hover:text-foreground transition-colors" aria-label="إغلاق">
              <svg className="size-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </SheetClose>
        </SheetHeader>

        {/* Body */}
        <div className="flex flex-1 flex-col overflow-hidden">
          {showFullSkeleton ? (
            <div className="flex flex-col flex-1">
              <div className="flex-1 space-y-4 p-6">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="flex gap-4">
                  <Skeleton className="h-20 w-16 rounded-lg shrink-0" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                    <Skeleton className="h-7 w-24 mt-3" />
                  </div>
                </div>
              ))}
              </div>
              {/* Footer skeleton */}
              <div className="border-t border-border px-6 py-5 space-y-3 shrink-0">
                <div className="flex justify-between">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-16" />
                </div>
                <div className="flex justify-between">
                  <Skeleton className="h-4 w-16" />
                  <Skeleton className="h-4 w-12" />
                </div>
                <Skeleton className="h-px w-full" />
                <div className="flex justify-between">
                  <Skeleton className="h-5 w-20" />
                  <Skeleton className="h-5 w-20" />
                </div>
                <Skeleton className="h-11 w-full rounded-lg" />
                <Skeleton className="h-9 w-full rounded-lg" />
              </div>
            </div>
          ) : isCartQueryError && !isAutoRecovering ? (
            <div className="flex flex-1 flex-col items-center justify-center gap-4 p-6 text-center">
              <p className="text-sm font-medium text-foreground">تعذر تحميل السلة</p>
              <p className="text-xs text-muted-foreground">أعد تهيئة السلة ثم حاول مرة أخرى.</p>
              <Button size="sm" type="button" onClick={() => void refreshCart()} disabled={isLoading}>
                إعادة تهيئة السلة
              </Button>
            </div>
          ) : items.length === 0 ? (
            <div className="flex flex-1 flex-col items-center justify-center gap-4 p-6 text-center">
              <div className="flex size-20 items-center justify-center rounded-full bg-muted">
                <svg className="size-10 text-muted-foreground/40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
                  <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
                  <line x1="3" y1="6" x2="21" y2="6" />
                  <path d="M16 10a4 4 0 0 1-8 0" />
                </svg>
              </div>
              <div>
                <p className="font-semibold text-base">سلتك فارغة</p>
                <p className="text-sm text-muted-foreground mt-1">أضف منتجات للبدء</p>
              </div>
              <Button size="sm" onClick={closeCart} asChild>
                <Link href="/products">تصفح المنتجات</Link>
              </Button>
            </div>
          ) : (
            <>
              {/* Items list */}
              <div className="flex-1 overflow-y-auto px-6">
                <div className="divide-y divide-border">
                  {items.map((item) => (
                    <CartItemRow key={item.id} item={item} currencyCode={currencyCode} />
                  ))}
                </div>
              </div>

              {/* Footer */}
              <div className="border-t border-border bg-background px-6 py-5 space-y-3 shrink-0">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">المجموع الجزئي</span>
                  <span className="font-medium">{formatPrice(subtotal, currencyCode)}</span>
                </div>
                {discount > 0 && (
                  <div className="flex items-center justify-between text-sm text-green-700 dark:text-green-400">
                    <span className="text-muted-foreground">الخصم</span>
                    <span className="font-medium">−{formatPrice(discount, currencyCode)}</span>
                  </div>
                )}
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">الشحن</span>
                  {shippingFee > 0 ? (
                    <span className="font-medium">{formatPrice(shippingFee, currencyCode)}</span>
                  ) : (
                    <span className="font-medium text-green-600">مجاني</span>
                  )}
                </div>
                <Separator />
                <div className="flex items-center justify-between font-bold text-base">
                  <span>الإجمالي</span>
                  <span className="text-primary">{formatPrice(total, currencyCode)}</span>
                </div>
                <Button
                  className="w-full pb-[max(0.5rem,env(safe-area-inset-bottom))]"
                  size="lg"
                  asChild
                  onClick={closeCart}
                >
                  <Link href="/checkout">إتمام الطلب</Link>
                </Button>
                <Button variant="outline" className="w-full" size="sm" onClick={closeCart} asChild>
                  <Link href="/cart">عرض السلة كاملاً</Link>
                </Button>
              </div>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}
