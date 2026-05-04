import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { getServerSession } from "@/lib/session"
import { recomputeAndPersistCart } from "@/lib/cart-server"
import { sendOrderConfirmation } from "@/lib/mailer"
import { cartCookie, getCartIdFromCookie } from "@/lib/cart-token"
import bcrypt from "bcryptjs"

interface CartItemForOrder {
  productId: string
  variantId: string
  title: string
  quantity: number
  unitPrice: number
}

interface ShippingAddress {
  firstName?: string
  lastName?: string
  phone?: string
  address?: string
  city?: string
  countryCode?: string
}

export async function GET(req: Request) {
  try {
    const session = await getServerSession()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") ?? "20", 10) || 20))
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10) || 1)
    const skip = (page - 1) * limit
    const status = searchParams.get("status") ?? ""
    const search = searchParams.get("search") ?? ""
    const dateFrom = searchParams.get("dateFrom") ?? ""
    const dateTo = searchParams.get("dateTo") ?? ""

    const baseWhere = session.role === "admin" ? {} : { userId: session.userId }

    const where = {
      ...baseWhere,
      ...(status && status !== "all" ? { status } : {}),
      ...(search
        ? {
            OR: [
              { displayId: { contains: search, mode: "insensitive" as const } },
              { user: { email: { contains: search, mode: "insensitive" as const } } },
              {
                user: {
                  OR: [
                    { firstName: { contains: search, mode: "insensitive" as const } },
                    { lastName: { contains: search, mode: "insensitive" as const } },
                  ],
                },
              },
            ],
          }
        : {}),
      ...(dateFrom || dateTo
        ? {
            createdAt: {
              ...(dateFrom ? { gte: new Date(dateFrom) } : {}),
              ...(dateTo ? { lte: new Date(dateTo) } : {}),
            },
          }
        : {}),
    }

    const [rawOrders, total] = await prisma.$transaction([
      prisma.order.findMany({
        where,
        include: {
          user: { select: { id: true, email: true, firstName: true, lastName: true } },
          items: true,
        },
        orderBy: { createdAt: "desc" },
        take: limit,
        skip,
      }),
      prisma.order.count({ where }),
    ])

    // Enrich order items with product thumbnails
    const allProductIds = [...new Set(rawOrders.flatMap((o) => o.items.map((i) => i.productId)))]
    const thumbMap = new Map<string, string>()
    if (allProductIds.length) {
      const imgs = await prisma.productImage.findMany({
        where: { productId: { in: allProductIds } },
        orderBy: [{ productId: "asc" }, { sortOrder: "asc" }],
        select: { productId: true, url: true },
      })
      for (const img of imgs) {
        if (!thumbMap.has(img.productId)) thumbMap.set(img.productId, img.url)
      }
    }
    const orders = rawOrders.map((o) => ({
      ...o,
      items: o.items.map((i) => ({ ...i, thumbnail: thumbMap.get(i.productId) ?? null })),
    }))

    return NextResponse.json({ orders, total, page, totalPages: Math.ceil(total / limit), limit })
  } catch {
    return NextResponse.json({ error: "Failed to fetch orders" }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { cartId, email, firstName, lastName, phone, address, city, countryCode } = body as {
      cartId?: string
      email?: string
      firstName?: string
      lastName?: string
      phone?: string
      address?: string
      city?: string
      countryCode?: string
    }

    const session = await getServerSession()

    let cartItems: CartItemForOrder[] = []
    let subtotal = 0
    let discountAmount = 0
    let total = 0
    let promotionId: string | null = null
    let promoCode: string | null = null

    if (cartId) {
      const cookieCartId = await getCartIdFromCookie()
      if (!cookieCartId || cookieCartId !== cartId) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 })
      }
      const cart = await recomputeAndPersistCart(cartId)
      if (!cart) {
        return NextResponse.json({ error: "Cart not found" }, { status: 404 })
      }
      cartItems = (cart.items ?? []).map((item) => ({
        productId: item.productId,
        variantId: item.variantId,
        title: item.title,
        quantity: item.quantity,
        unitPrice: Number(item.unitPrice),
      }))
      subtotal = Number(cart.subtotal)
      discountAmount = Number(cart.discountAmount)
      total = Number(cart.total)
      promotionId = cart.promotionId
      if (cart.promotion) {
        promoCode = cart.promotion.code
      }
    }

    if (cartItems.length === 0) {
      return NextResponse.json({ error: "Cart is empty" }, { status: 400 })
    }

    let userId: string

    if (session) {
      userId = session.userId
      const user = await prisma.user.findUnique({ where: { id: userId } })
      if (!user) {
        return NextResponse.json({ error: "Invalid session" }, { status: 401 })
      }
    } else {
      if (!email) {
        return NextResponse.json({ error: "Email required" }, { status: 400 })
      }
      let user = await prisma.user.findUnique({ where: { email } })
      if (!user) {
        const guestPassword = await bcrypt.hash(crypto.randomUUID(), 10)
        user = await prisma.user.create({
          data: {
            email,
            password: guestPassword,
            firstName,
            lastName,
            role: "customer",
          },
        })
      }
      userId = user.id
    }

    const orderCount = await prisma.order.count()
    const displayId = `${1000 + orderCount + 1}`

    const order = await prisma.$transaction(async (tx) => {
      for (const item of cartItems) {
        const variant = await tx.variant.findUnique({ where: { id: item.variantId } })
        if (!variant) throw new Error(`VARIANT_NOT_FOUND:${item.variantId}`)
        if (variant.inventory < item.quantity) {
          throw new Error(`INSUFFICIENT_STOCK:${item.title ?? item.variantId}:${variant.inventory}`)
        }
        await tx.variant.update({
          where: { id: item.variantId },
          data: { inventory: { decrement: item.quantity } },
        })
      }

      const created = await tx.order.create({
        data: {
          displayId,
          userId,
          subtotal,
          discountAmount,
          total,
          currencyCode: "tnd",
          paymentMethod: "cod",
          status: "pending",
          shippingAddress: { firstName, lastName, phone, address, city, countryCode },
          promotionId,
          promoCode,
          items: {
            create: cartItems.map((item) => ({
              productId: item.productId,
              variantId: item.variantId,
              title: item.title,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
            })),
          },
        },
        include: { items: true },
      })

      if (cartId) {
        await tx.cart.delete({ where: { id: cartId } }).catch(() => {})
      }

      return created
    })

    const userEmail =
      email ?? (await prisma.user.findUnique({ where: { id: userId }, select: { email: true } }))?.email

    let emailSent = false
    if (userEmail) {
      const shippingFee =
        Math.round(Math.max(0, total - (subtotal - discountAmount)) * 100) / 100
      emailSent = await sendOrderConfirmation(
        {
          id: order.id,
          displayId: order.displayId,
          total: Number(order.total),
          currencyCode: order.currencyCode,
          subtotal,
          discountAmount,
          shippingFee,
          shippingAddress: order.shippingAddress as ShippingAddress | null,
          items: order.items.map((i) => ({
            title: i.title,
            quantity: i.quantity,
            unitPrice: Number(i.unitPrice),
          })),
        },
        userEmail
      )
    }

    const response = NextResponse.json({ ...order, emailSent }, { status: 201 })
    if (cartId) {
      response.cookies.set(cartCookie.name, "", { ...cartCookie.options, maxAge: 0 })
    }
    return response
  } catch (error) {
    console.error("Order creation error:", error)
    const msg = error instanceof Error ? error.message : ""
    if (msg.startsWith("INSUFFICIENT_STOCK:")) {
      const parts = msg.split(":")
      const itemName = parts[1] ?? "المنتج"
      const available = parts[2] ?? "0"
      return NextResponse.json(
        { error: `المخزون غير كافٍ لـ "${itemName}" (متاح: ${available})` },
        { status: 400 }
      )
    }
    if (msg.startsWith("VARIANT_NOT_FOUND:")) {
      return NextResponse.json({ error: "أحد المنتجات في سلتك لم يعد متاحاً" }, { status: 400 })
    }
    return NextResponse.json({ error: "Failed to create order" }, { status: 500 })
  }
}
