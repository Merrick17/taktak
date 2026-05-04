import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { requireAdminResponse } from "@/lib/require-admin"
import bcrypt from "bcryptjs"

export async function GET(req: Request) {
  try {
    const denied = await requireAdminResponse()
    if (denied) return denied

    const { searchParams } = new URL(req.url)
    const limit = Math.min(50, parseInt(searchParams.get("limit") ?? "20"))
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1"))
    const search = searchParams.get("search") ?? ""
    const dateFrom = searchParams.get("dateFrom") ?? ""
    const dateTo = searchParams.get("dateTo") ?? ""

    const where = {
      ...(search
        ? {
            OR: [
              { email: { contains: search, mode: "insensitive" as const } },
              { firstName: { contains: search, mode: "insensitive" as const } },
              { lastName: { contains: search, mode: "insensitive" as const } },
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

    const [customers, total] = await prisma.$transaction([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
          createdAt: true,
          updatedAt: true,
          orders: {
            select: { id: true, total: true, status: true, createdAt: true },
          },
        },
        orderBy: { createdAt: "desc" },
        take: limit,
        skip: (page - 1) * limit,
      }),
      prisma.user.count({ where }),
    ])

    return NextResponse.json({
      customers,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    })
  } catch {
    return NextResponse.json({ error: "Failed to fetch customers" }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const denied = await requireAdminResponse()
    if (denied) return denied

    const body = await req.json()
    const { email, password, firstName, lastName, role = "customer" } = body
    const hashed = await bcrypt.hash(String(password || "changeme123"), 10)
    const customer = await prisma.user.create({
      data: { email, password: hashed, firstName, lastName, role },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    })
    return NextResponse.json(customer, { status: 201 })
  } catch (error: unknown) {
    if ((error as { code?: string })?.code === "P2002") {
      return NextResponse.json({ error: "Email already exists" }, { status: 409 })
    }
    return NextResponse.json({ error: "Failed to create customer" }, { status: 500 })
  }
}
