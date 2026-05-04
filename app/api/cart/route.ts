import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { enrichCartForApi } from "@/lib/cart-enrich"
import { createCartToken, getCartIdFromCookie, cartCookie } from "@/lib/cart-token"

export async function GET() {
  try {
    const cartId = await getCartIdFromCookie()
    if (!cartId) return NextResponse.json({ error: "No cart found" }, { status: 404 })

    const cart = await prisma.cart.findUnique({
      where: { id: cartId },
      include: { items: true, promotion: true },
    })
    if (!cart) return NextResponse.json({ error: "No cart found" }, { status: 404 })
    return NextResponse.json(await enrichCartForApi(cart))
  } catch {
    return NextResponse.json({ error: "Failed to fetch cart" }, { status: 500 })
  }
}

export async function POST() {
  try {
    const cart = await prisma.cart.create({ data: {} })
    const full = await prisma.cart.findUniqueOrThrow({
      where: { id: cart.id },
      include: { items: true, promotion: true },
    })
    const token = await createCartToken(cart.id)
    const res = NextResponse.json(await enrichCartForApi(full))
    res.cookies.set(cartCookie.name, token, cartCookie.options)
    return res
  } catch {
    return NextResponse.json({ error: "Failed to create cart" }, { status: 500 })
  }
}
