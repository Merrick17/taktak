import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { recomputeAndPersistCart } from "@/lib/cart-server"
import { getCartIdFromCookie } from "@/lib/cart-token"

/** Apply or remove promotion on cart. Body: { code: string | null } — null clears promo. */
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
    const body = await req.json().catch(() => ({}))
    const code = body.code as string | null | undefined

    const cart = await prisma.cart.findUnique({ where: { id: cartId } })
    if (!cart) {
      return NextResponse.json({ error: "Cart not found" }, { status: 404 })
    }

    if (code == null || code === "") {
      await prisma.cart.update({
        where: { id: cartId },
        data: { promotionId: null },
      })
      const updated = await recomputeAndPersistCart(cartId)
      if (!updated) return NextResponse.json({ error: "Cart not found" }, { status: 404 })
      return NextResponse.json(updated)
    }

    const normalized = String(code).trim().toUpperCase()
    const promotion = await prisma.promotion.findFirst({
      where: { code: { equals: normalized, mode: "insensitive" as const } },
    })

    if (!promotion) {
      return NextResponse.json({ error: "رمز الخصم غير صالح" }, { status: 400 })
    }

    await prisma.cart.update({
      where: { id: cartId },
      data: { promotionId: promotion.id },
    })

    const updated = await recomputeAndPersistCart(cartId)
    if (!updated) return NextResponse.json({ error: "Cart not found" }, { status: 404 })
    return NextResponse.json(updated)
  } catch (error) {
    console.error("Cart promotion error:", error)
    return NextResponse.json({ error: "Failed to apply promotion" }, { status: 500 })
  }
}
