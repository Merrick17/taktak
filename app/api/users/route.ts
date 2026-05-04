import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { requireAdminResponse } from "@/lib/require-admin"

export async function GET() {
  const denied = await requireAdminResponse()
  if (denied) return denied

  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
    })
    return NextResponse.json(users)
  } catch {
    return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 })
  }
}
