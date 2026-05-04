import type { OrderItem } from "@prisma/client"
import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { getServerSession } from "@/lib/session"

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await getServerSession()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, email: true, firstName: true, lastName: true } },
        items: true,
      },
    })
    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 })
    }

    if (session.role !== "admin" && order.userId !== session.userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // Enrich order items with product thumbnails
    const productIds = [...new Set(order.items.map((i: OrderItem) => i.productId))]
    const thumbMap = new Map<string, string>()
    if (productIds.length) {
      const imgs = await prisma.productImage.findMany({
        where: { productId: { in: productIds } },
        orderBy: [{ productId: "asc" }, { sortOrder: "asc" }],
        select: { productId: true, url: true },
      })
      for (const img of imgs) {
        if (!thumbMap.has(img.productId)) thumbMap.set(img.productId, img.url)
      }
    }
    const enrichedOrder = {
      ...order,
      items: order.items.map((i: OrderItem) => ({
        ...i,
        thumbnail: thumbMap.get(i.productId) ?? null,
      })),
    }

    return NextResponse.json(enrichedOrder)
  } catch {
    return NextResponse.json({ error: "Failed to fetch order" }, { status: 500 })
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession()
    if (!session || session.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { id } = await params
    const body = await req.json()
    const { status } = body
    const order = await prisma.order.update({
      where: { id },
      data: { status },
    })
    return NextResponse.json(order)
  } catch {
    return NextResponse.json({ error: "Failed to update order" }, { status: 500 })
  }
}
