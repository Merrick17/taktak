import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { recomputeAndPersistCart } from "@/lib/cart-server"
import { getCartIdFromCookie } from "@/lib/cart-token"

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string; itemId: string }> }
) {
  try {
    const { id: cartId, itemId } = await params
    const cookieCartId = await getCartIdFromCookie()
    if (!cookieCartId || cookieCartId !== cartId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }
    const { quantity } = await req.json()
    const item = await prisma.cartItem.findUnique({ where: { id: itemId }, select: { cartId: true } })
    if (!item || item.cartId !== cartId) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 })
    }
    await prisma.cartItem.update({
      where: { id: itemId },
      data: { quantity },
    })
    const cart = await recomputeAndPersistCart(cartId)
    return NextResponse.json(cart)
  } catch {
    return NextResponse.json({ error: "Failed to update item" }, { status: 500 })
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string; itemId: string }> }
) {
  try {
    const { id: cartId, itemId } = await params
    const cookieCartId = await getCartIdFromCookie()
    if (!cookieCartId || cookieCartId !== cartId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }
    const item = await prisma.cartItem.findUnique({ where: { id: itemId }, select: { cartId: true } })
    if (!item || item.cartId !== cartId) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 })
    }
    await prisma.cartItem.delete({ where: { id: itemId } })
    const cart = await recomputeAndPersistCart(cartId)
    return NextResponse.json(cart)
  } catch {
    return NextResponse.json({ error: "Failed to remove item" }, { status: 500 })
  }
}
