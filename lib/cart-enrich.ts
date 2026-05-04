import type { Prisma } from "@prisma/client"
import prisma from "@/lib/prisma"
import { getShippingFeeFromSettings } from "@/lib/shipping-fee"

type CartPayload = Prisma.CartGetPayload<{ include: { items: true; promotion: true } }>

/** Attach product thumbnail URLs and plain numbers for JSON clients. */
export async function enrichCartForApi(cart: CartPayload | null) {
  if (!cart) return null

  const items = cart.items ?? []
  const thumbByProduct = new Map<string, string>()
  const handleByProduct = new Map<string, string>()
  if (items.length) {
    const productIds = [...new Set(items.map((i) => i.productId))]
    const [imgs, products] = await Promise.all([
      prisma.productImage.findMany({
        where: { productId: { in: productIds } },
        orderBy: [{ productId: "asc" }, { sortOrder: "asc" }],
        select: { productId: true, url: true },
      }),
      prisma.product.findMany({
        where: { id: { in: productIds } },
        select: { id: true, handle: true, title: true },
      }),
    ])
    for (const img of imgs) {
      if (!thumbByProduct.has(img.productId)) thumbByProduct.set(img.productId, img.url)
    }
    for (const p of products) {
      handleByProduct.set(p.id, p.handle)
    }
  }

  const shippingFee = await getShippingFeeFromSettings()

  return {
    ...cart,
    subtotal: Number(cart.subtotal),
    discountAmount: Number(cart.discountAmount),
    total: Number(cart.total),
    shippingFee,
    promotion: cart.promotion
      ? {
          ...cart.promotion,
          value: Number(cart.promotion.value),
        }
      : null,
    items: items.map((item) => ({
      ...item,
      unitPrice: Number(item.unitPrice),
      thumbnail: thumbByProduct.get(item.productId) ?? null,
      product_handle: handleByProduct.get(item.productId) ?? null,
    })),
  }
}
