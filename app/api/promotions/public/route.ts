import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"

/** Public endpoint — returns all active promotions (code + value + type only). */
export async function GET() {
  try {
    const promotions = await prisma.promotion.findMany({
      select: { id: true, code: true, value: true, type: true },
      orderBy: { value: "desc" },
    })
    return NextResponse.json(promotions)
  } catch {
    return NextResponse.json([], { status: 500 })
  }
}
