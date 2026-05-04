import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { requireAdminResponse } from "@/lib/require-admin"
import bcrypt from "bcryptjs"

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const denied = await requireAdminResponse()
    if (denied) return denied

    const { id } = await params
    const customer = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        createdAt: true,
        updatedAt: true,
        orders: {
          include: { items: true },
          orderBy: { createdAt: "desc" },
        },
      },
    })
    if (!customer) {
      return NextResponse.json({ error: "Customer not found" }, { status: 404 })
    }
    return NextResponse.json(customer)
  } catch {
    return NextResponse.json({ error: "Failed to fetch customer" }, { status: 500 })
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const denied = await requireAdminResponse()
    if (denied) return denied

    const { id } = await params
    const body = await req.json()
    const { firstName, lastName, email, password, role } = body
    const data: Record<string, unknown> = {}
    if (firstName !== undefined) data.firstName = firstName
    if (lastName !== undefined) data.lastName = lastName
    if (email !== undefined) data.email = email
    if (role !== undefined) data.role = role
    if (password !== undefined && String(password).length > 0) {
      data.password = await bcrypt.hash(String(password), 10)
    }

    const customer = await prisma.user.update({
      where: { id },
      data,
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
    return NextResponse.json(customer)
  } catch (error: unknown) {
    const err = error as { code?: string }
    if (err?.code === "P2002") {
      return NextResponse.json({ error: "Email already exists" }, { status: 409 })
    }
    return NextResponse.json({ error: "Failed to update customer" }, { status: 500 })
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
    await prisma.user.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: "Failed to delete customer" }, { status: 500 })
  }
}
