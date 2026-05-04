// UI-level helpers derived from Prisma types
export function getProductPrice(
  variant: Pick<AppVariant, "price"> | { price?: number | null } | undefined | null
): number {
  return Number(variant?.price) ?? 0
}

export function getCartItemCount(cart: Pick<AppCart, "items"> | null): number {
  if (!cart?.items) return 0
  return cart.items.reduce((sum: number, i) => sum + i.quantity, 0)
}

export function getCartSubtotal(cart: AppCart | null): number {
  if (!cart) return 0
  if (cart.items?.length) {
    return Math.round(
      cart.items.reduce(
        (sum: number, i) =>
          sum + Number(i.unitPrice ?? (i as CartLineItem).unit_price ?? 0) * i.quantity,
        0
      ) * 100
    ) / 100
  }
  const s = Number(cart.subtotal)
  return Number.isNaN(s) ? 0 : s
}

export function getCartDiscount(cart: AppCart | null): number {
  if (!cart) return 0
  return Math.round(Number(cart.discountAmount ?? 0) * 100) / 100
}

/** Delivery fee from server (`shipping_fee` setting), aligned with cart recomputation. */
export function getCartShippingFee(cart: AppCart | null): number {
  if (!cart) return 0
  if (typeof cart.shippingFee === "number" && !Number.isNaN(cart.shippingFee)) {
    return Math.max(0, Math.round(cart.shippingFee * 100) / 100)
  }
  const total = Number(cart.total)
  const sub = getCartSubtotal(cart) - getCartDiscount(cart)
  if (!Number.isNaN(total)) return Math.max(0, Math.round((total - sub) * 100) / 100)
  return 0
}

export function getCartTotal(cart: AppCart | null): number {
  if (!cart) return 0
  const t = Number(cart.total)
  if (!Number.isNaN(t)) return Math.max(0, t)
  return Math.max(0, getCartSubtotal(cart) - getCartDiscount(cart) + getCartShippingFee(cart))
}

export function formatPrice(amount: number, currencyCode = "tnd"): string {
  return new Intl.NumberFormat("ar-TN", {
    style: "currency",
    currency: currencyCode.toUpperCase(),
    minimumFractionDigits: 3,
  }).format(amount)
}

// Checkout form input
export interface CheckoutFormInput {
  email: string
  firstName: string
  lastName: string
  phone: string
  address: string
  city: string
  countryCode: string
}

export type SortOption = "featured" | "price_asc" | "price_desc" | "created_at"

// ─── Prisma-derived types ─────────────────────────────────

export interface AppProduct {
  id: string
  title: string
  description: string | null
  handle: string
  status: string
  adsBoosted: boolean
  createdAt: string
  updatedAt: string
  categories: AppCategory[]
  variants: AppVariant[]
  thumbnail?: string | null
  images?: { url: string; alt?: string }[]
}

export interface AppVariant {
  id: string
  productId: string
  title: string | null
  sku: string
  price: number
  inventory: number
  options: AppOption[]
  calculated_price?: { calculated_amount: number; original_amount?: number; currency_code?: string }
}

export interface AppOption {
  id: string
  variantId: string
  name: string
  value: string
}

export interface AppCategory {
  id: string
  name: string
  handle: string
  createdAt: string
  updatedAt: string
  products?: AppProduct[]
  image?: string | null
  imageUrl?: string | null
  metadata?: Record<string, unknown> | null
}

export interface AppUser {
  id: string
  email: string
  firstName: string | null
  lastName: string | null
  password?: string
  role?: string
  orders: AppOrder[]
  createdAt: string
  updatedAt: string
}

export interface AppOrder {
  id: string
  displayId: string
  userId: string
  user?: AppUser
  subtotal?: number
  discountAmount?: number
  promoCode?: string | null
  total: number
  currencyCode: string
  paymentMethod?: string
  status: string
  shippingAddress: Record<string, unknown> | null
  items: AppOrderItem[]
  createdAt: string
  updatedAt: string
  fulfillment_status?: string
  payment_status?: string
  shipping_address?: Record<string, unknown> | null
  payment_method?: { type: string } | null
}

export interface AppOrderItem {
  id: string
  orderId: string
  productId: string
  variantId: string
  title: string
  quantity: number
  unitPrice: number
  createdAt: string
  thumbnail?: string | null
}

export interface AppPromotion {
  id: string
  code: string
  value: number
  type: string
  createdAt: string
  updatedAt: string
}

export interface AppCart {
  id: string
  subtotal?: number
  discountAmount?: number
  total: number
  /** Mirrors admin `shipping_fee` setting; included in `total` after server recompute. */
  shippingFee?: number
  items: AppCartItem[]
  promotion?: { id: string; code: string; type: string; value: number } | null
  promotionId?: string | null
  email?: string
  shipping_address?: Record<string, unknown> | null
  billing_address?: Record<string, unknown> | null
  currency_code?: string
}

export interface AppCartItem {
  id: string
  variantId: string
  productId: string
  title: string
  quantity: number
  unitPrice: number
  thumbnail?: string | null
}

/** Cart line in drawer / mini-cart (camelCase + optional legacy snake_case). */
export type CartLineItem = AppCartItem & {
  unit_price?: number
  product_title?: string
  product_handle?: string
  variant_title?: string
}

/** Default storefront region (currency display). */
export type AppRegion = { id: string; name: string; currency_code: string }
