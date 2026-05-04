/** Client-only Meta Pixel helpers. Safe to import from "use client" components. */

declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void
  }
}

export function trackMetaEvent(eventName: string, params?: Record<string, unknown>) {
  if (typeof window === "undefined") return
  const fbq = window.fbq
  if (typeof fbq !== "function") return
  if (params && Object.keys(params).length > 0) {
    fbq("track", eventName, params)
  } else {
    fbq("track", eventName)
  }
}

export function trackMetaPageView() {
  trackMetaEvent("PageView")
}

export function metaViewContentParams(product: { id: string; title: string }, unitPrice: number) {
  return {
    content_ids: [product.id],
    content_type: "product",
    content_name: product.title,
    value: unitPrice,
    currency: "TND",
  }
}

export function metaAddToCartParams(product: { id: string; title: string }, unitPrice: number, quantity: number) {
  return {
    content_ids: [product.id],
    content_type: "product",
    content_name: product.title,
    value: unitPrice * quantity,
    currency: "TND",
    num_items: quantity,
  }
}

export function metaInitiateCheckoutParams(items: { productId: string; quantity: number; unitPrice: number }[], total: number, currencyCode: string) {
  return {
    content_ids: items.map((i) => i.productId),
    value: total,
    currency: (currencyCode || "TND").toUpperCase(),
    num_items: items.reduce((s, i) => s + i.quantity, 0),
  }
}

export function metaPurchaseParams(order: {
  total: unknown
  currencyCode?: string | null
  items: { productId: string; quantity: number; unitPrice: unknown }[]
}) {
  const contents = order.items.map((i) => ({
    id: i.productId,
    quantity: i.quantity,
    item_price: Number(i.unitPrice),
  }))
  return {
    value: Number(order.total),
    currency: (order.currencyCode || "TND").toString().toUpperCase(),
    content_ids: order.items.map((i) => i.productId),
    contents,
    num_items: order.items.reduce((s, i) => s + i.quantity, 0),
  }
}
