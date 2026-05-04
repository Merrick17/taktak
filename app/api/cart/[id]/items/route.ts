import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { recomputeAndPersistCart } from "@/lib/cart-server"
import { getCartIdFromCookie } from "@/lib/cart-token"

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: cartId } = await params
    const cookieCartId = await getCartIdFromCookie()
    if (!cookieCartId || cookieCartId !== cartId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }
    const { variantId, quantity } = await req.json()
    const qty = Number(quantity) || 1

    // Verify cart still exists (may have been cleared by a DB reset or expiry)
    const existingCart = await prisma.cart.findUnique({ where: { id: cartId }, select: { id: true } })
    if (!existingCart) {
      return NextResponse.json({ error: "Cart not found", code: "CART_NOT_FOUND" }, { status: 404 })
    }

    const variant = await prisma.variant.findUnique({ where: { id: variantId } })
    if (!variant) return NextResponse.json({ error: "Variant not found" }, { status: 404 })

    if (variant.inventory < qty) {
      return NextResponse.json(
        { error: "المخزون غير كافٍ", available: variant.inventory },
        { status: 400 }
      )
    }

    await prisma.cartItem.create({
      data: {
        cartId,
        variantId,
        productId: variant.productId,
        title: variant.title || "Product",
        quantity: qty,
        unitPrice: variant.price,
      },
    })

    const updatedCart = await recomputeAndPersistCart(cartId)
    return NextResponse.json(updatedCart)
  } catch {
    return NextResponse.json({ error: "Failed to add item" }, { status: 500 })
  }
}
