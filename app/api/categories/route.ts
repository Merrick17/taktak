import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { requireAdminResponse } from "@/lib/require-admin"

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const q = searchParams.get("q") ?? ""

    const where = q
      ? {
          OR: [
            { name: { contains: q, mode: "insensitive" as const } },
            { handle: { contains: q, mode: "insensitive" as const } },
          ],
        }
      : {}

    const categories = await prisma.category.findMany({
      where,
      include: { products: { select: { id: true } } },
      orderBy: { name: "asc" },
    })
    return NextResponse.json(categories)
  } catch {
    return NextResponse.json({ error: "Failed to fetch categories" }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const denied = await requireAdminResponse()
    if (denied) return denied

    const body = await req.json()
    const { name, handle, image } = body
    const category = await prisma.category.create({
      data: { name, handle, image: image || null },
      include: { products: { select: { id: true } } },
    })
    return NextResponse.json(category)
  } catch {
    return NextResponse.json({ error: "Failed to create category" }, { status: 500 })
  }
}
