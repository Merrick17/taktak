import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { requireAdminResponse } from "@/lib/require-admin"

export async function GET(req: Request) {
  try {
    const denied = await requireAdminResponse()
    if (denied) return denied

    const { searchParams } = new URL(req.url)
    const limit = Math.min(50, parseInt(searchParams.get("limit") ?? "20"))
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1"))
    const type = searchParams.get("type") ?? ""
    const status = searchParams.get("status") ?? ""

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = {}
    if (type && type !== "all") where.type = type
    if (status === "active") where.isActive = true
    else if (status === "inactive") where.isActive = false

    const [promotions, total] = await prisma.$transaction([
      prisma.promotion.findMany({
        where,
        orderBy: { createdAt: "desc" },
        take: limit,
        skip: (page - 1) * limit,
        include: {
          _count: { select: { orders: true } },
        },
      }),
      prisma.promotion.count({ where }),
    ])

    return NextResponse.json({
      promotions,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    })
  } catch {
    return NextResponse.json({ error: "Failed to fetch promotions" }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const denied = await requireAdminResponse()
    if (denied) return denied

    const body = await req.json()
    const { code, value, type, isActive, startDate, endDate, maxUses, minOrderAmount } = body
    const promo = await prisma.promotion.create({
      data: {
        code: String(code).trim().toUpperCase(),
        value,
        type,
        isActive: isActive !== undefined ? isActive : true,
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
        maxUses: maxUses ?? null,
        minOrderAmount: minOrderAmount ?? null,
      },
    })
    return NextResponse.json(promo)
  } catch {
    return NextResponse.json({ error: "Failed to create promotion" }, { status: 500 })
  }
}
