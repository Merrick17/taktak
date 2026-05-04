import Image from "next/image"
import { Separator } from "@/components/ui/separator"
import {
  formatPrice,
  getCartSubtotal,
  getCartDiscount,
  getCartTotal,
  getCartShippingFee,
} from "@/lib/types"
import type { AppCart } from "@/lib/types"

interface OrderSummaryProps {
  cart: AppCart
}

export function OrderSummary({ cart }: OrderSummaryProps) {
  const currencyCode = cart.currency_code ?? "tnd"
  const subtotal = getCartSubtotal(cart)
  const discount = getCartDiscount(cart)
  const total = getCartTotal(cart)
  const promoLabel = cart.promotion?.code
  const shippingFee = getCartShippingFee(cart)

  return (
    <div className="rounded-xl border border-border bg-muted/30 p-6">
      <h3 className="font-semibold text-base mb-4">ملخص الطلب</h3>

      <div className="space-y-4 mb-4">
        {cart.items?.map((item) => (
          <div key={item.id} className="flex items-center gap-3">
            <div className="relative h-14 w-12 shrink-0 overflow-hidden rounded-lg bg-muted">
              {item.thumbnail && (
                <Image src={item.thumbnail} alt={item.title ?? ""} fill className="object-cover" sizes="48px" />
              )}
              <span className="absolute -end-1.5 -top-1.5 flex size-4 items-center justify-center rounded-full bg-foreground text-[9px] font-bold text-background">
                {item.quantity}
              </span>
            </div>
            <div className="flex flex-1 items-center justify-between gap-2">
              <div className="min-w-0">
                <p className="text-sm font-medium leading-tight truncate">{item.title}</p>
              </div>
              <span className="text-sm font-medium shrink-0">
                {formatPrice((item.unitPrice ?? (item as { unit_price?: number }).unit_price ?? 0) * item.quantity, currencyCode)}
              </span>
            </div>
          </div>
        ))}
      </div>

      <Separator className="my-4" />

      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-muted-foreground">المجموع الجزئي</span>
          <span>{formatPrice(subtotal, currencyCode)}</span>
        </div>
        {discount > 0 && (
          <div className="flex justify-between text-green-700 dark:text-green-400">
            <span>
              الخصم{promoLabel ? ` (${promoLabel})` : ""}
            </span>
            <span>−{formatPrice(discount, currencyCode)}</span>
          </div>
        )}
        <div className="flex justify-between">
          <span className="text-muted-foreground">الشحن</span>
          {shippingFee > 0 ? (
            <span className="font-medium">{formatPrice(shippingFee, currencyCode)}</span>
          ) : (
            <span className="text-green-600 font-medium">مجاني</span>
          )}
        </div>
        <Separator className="my-2" />
        <div className="flex justify-between font-semibold text-base">
          <span>الإجمالي</span>
          <span>{formatPrice(total, currencyCode)}</span>
        </div>
      </div>
    </div>
  )
}
