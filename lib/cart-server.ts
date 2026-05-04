import prisma from "@/lib/prisma"
import type { Prisma } from "@prisma/client"
import { enrichCartForApi } from "@/lib/cart-enrich"
import { getShippingFeeFromSettings } from "@/lib/shipping-fee"

function roundMoney(n: number): number {
  return Math.round(n * 100) / 100
}

/** Subtotal from line items only (before promo). */
export function subtotalFromItems(
  items: { quantity: number; unitPrice: Prisma.Decimal | number | null }[]
): number {
  return roundMoney(
    items.reduce((sum, i) => sum + Number(i.unitPrice ?? 0) * i.quantity, 0)
  )
}

export function discountForPromotion(
  subtotal: number,
  promo: { type: string; value: Prisma.Decimal | number }
): number {
  const v = Number(promo.value)
  if (subtotal <= 0) return 0
  if (promo.type === "fixed") {
    return roundMoney(Math.min(subtotal, Math.max(0, v)))
  }
  // percentage
  const pct = Math.min(100, Math.max(0, v))
  return roundMoney(Math.min(subtotal, (subtotal * pct) / 100))
}

export async function recomputeAndPersistCart(cartId: string) {
  const cart = await prisma.cart.findUnique({
    where: { id: cartId },
    include: { items: true, promotion: true },
  })
  if (!cart) return null

  const subtotal = subtotalFromItems(cart.items)
  let discountAmount = 0
  if (cart.promotion) {
    discountAmount = discountForPromotion(subtotal, cart.promotion)
  }

  const shippingFee = await getShippingFeeFromSettings()

  const total = roundMoney(Math.max(0, subtotal - discountAmount + shippingFee))

  await prisma.cart.update({
    where: { id: cartId },
    data: {
      subtotal,
      discountAmount,
      total,
    },
  })

  const fresh = await prisma.cart.findUnique({
    where: { id: cartId },
    include: { items: true, promotion: true },
  })
  return enrichCartForApi(fresh)
}
