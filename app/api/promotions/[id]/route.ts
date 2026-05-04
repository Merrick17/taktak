import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { requireAdminResponse } from "@/lib/require-admin"

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const denied = await requireAdminResponse()
    if (denied) return denied

    const { id } = await params
    const body = await req.json()
    const { code, value, type, isActive, startDate, endDate, maxUses, minOrderAmount } = body

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data: any = {}
    if (code != null) data.code = String(code).trim().toUpperCase()
    if (value !== undefined && value !== null) data.value = value
    if (type != null) data.type = type
    if (isActive !== undefined) data.isActive = isActive
    if (startDate !== undefined) data.startDate = startDate ? new Date(startDate) : null
    if (endDate !== undefined) data.endDate = endDate ? new Date(endDate) : null
    if (maxUses !== undefined) data.maxUses = maxUses ?? null
    if (minOrderAmount !== undefined) data.minOrderAmount = minOrderAmount ?? null

    const promo = await prisma.promotion.update({ where: { id }, data })
    return NextResponse.json(promo)
  } catch {
    return NextResponse.json({ error: "Failed to update promotion" }, { status: 500 })
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const denied = await requireAdminResponse()
    if (denied) return denied

    const { id } = await params
    await prisma.promotion.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: "Failed to delete promotion" }, { status: 500 })
  }
}
