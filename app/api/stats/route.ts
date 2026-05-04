import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { requireAdminResponse } from "@/lib/require-admin"

export async function GET(req: Request) {
  try {
    const denied = await requireAdminResponse()
    if (denied) return denied

    const { searchParams } = new URL(req.url)
    const dateFromParam = searchParams.get("dateFrom")

    const sevenDaysAgo = dateFromParam
      ? new Date(dateFromParam)
      : new Date()
    sevenDaysAgo.setHours(0, 0, 0, 0)

    // If custom date range, shift from -6 days to the start of the range
    if (!dateFromParam) {
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6)
    }

    const [
      totalSales,
      totalOrders,
      totalProducts,
      totalCustomers,
      recentOrders,
      ordersByStatusRaw,
      last7DaysOrders,
      topProductsRaw,
    ] = await Promise.all([
      prisma.order.aggregate({ _sum: { total: true } }),
      prisma.order.count(),
      prisma.product.count(),
      prisma.user.count(),
      prisma.order.findMany({
        take: 5,
        include: {
          user: { select: { firstName: true, lastName: true, email: true } },
          items: true,
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.order.groupBy({
        by: ["status"],
        _count: { status: true },
      }),
      prisma.order.findMany({
        where: { createdAt: { gte: sevenDaysAgo } },
        select: { createdAt: true, total: true },
        orderBy: { createdAt: "asc" },
      }),
      prisma.orderItem.groupBy({
        by: ["productId", "title"],
        _sum: { quantity: true },
        orderBy: { _sum: { quantity: "desc" } },
        take: 5,
      }),
    ])

    // Build last 7 days array
    const dateMap: Record<string, { revenue: number; orders: number }> = {}
    for (let i = 6; i >= 0; i--) {
      const d = new Date()
      d.setDate(d.getDate() - i)
      const key = d.toISOString().slice(0, 10)
      dateMap[key] = { revenue: 0, orders: 0 }
    }
    for (const o of last7DaysOrders) {
      const key = new Date(o.createdAt).toISOString().slice(0, 10)
      if (dateMap[key]) {
        dateMap[key].revenue += Number(o.total)
        dateMap[key].orders += 1
      }
    }
    const salesLast7Days = Object.entries(dateMap).map(([date, v]) => ({
      date,
      revenue: Math.round(v.revenue * 1000) / 1000,
      orders: v.orders,
    }))

    const ordersByStatus = ordersByStatusRaw.map((r) => ({
      status: r.status,
      count: r._count.status,
    }))

    const topProducts = topProductsRaw.map((r) => ({
      productId: r.productId,
      title: r.title,
      units: r._sum.quantity ?? 0,
    }))

    return NextResponse.json({
      totalSales: Number(totalSales._sum.total ?? 0),
      totalOrders,
      totalProducts,
      totalCustomers,
      recentOrders: recentOrders.map((o) => ({
        id: o.id,
        displayId: o.displayId,
        total: Number(o.total),
        currencyCode: o.currencyCode,
        status: o.status,
        createdAt: o.createdAt,
        customerName:
          o.user?.firstName && o.user?.lastName
            ? `${o.user.firstName} ${o.user.lastName}`
            : (o.user?.email ?? "—"),
        itemCount: o.items.length,
      })),
      ordersByStatus,
      salesLast7Days,
      topProducts,
    })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: "Failed to fetch stats" }, { status: 500 })
  }
}
