import { NextResponse } from "next/server"
import { recomputeAndPersistCart } from "@/lib/cart-server"
import { getCartIdFromCookie } from "@/lib/cart-token"

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const cookieCartId = await getCartIdFromCookie()
    if (!cookieCartId || cookieCartId !== id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }
    const cart = await recomputeAndPersistCart(id)
    if (!cart) return NextResponse.json({ error: "Cart not found" }, { status: 404 })
    return NextResponse.json(cart)
  } catch {
    return NextResponse.json({ error: "Failed to fetch cart" }, { status: 500 })
  }
}
