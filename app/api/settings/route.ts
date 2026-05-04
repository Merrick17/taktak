import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { requireAdminResponse } from "@/lib/require-admin"
import { getServerSession } from "@/lib/session"

const PUBLIC_KEYS = [
  "social_instagram",
  "social_facebook",
  "social_tiktok",
  "store_name",
  "store_tagline",
  "shipping_fee",
  "support_whatsapp",
  "meta_pixel_id",
]

export async function GET() {
  try {
    const session = await getServerSession()
    const keys = session?.role === "admin" ? undefined : PUBLIC_KEYS

    const settings = await prisma.setting.findMany(
      keys ? { where: { key: { in: keys } } } : undefined
    )

    const map: Record<string, string> = {}
    for (const s of settings) {
      map[s.key] = s.value
    }
    return NextResponse.json(map)
  } catch {
    return NextResponse.json({}, { status: 500 })
  }
}

export async function PUT(req: Request) {
  const denied = await requireAdminResponse()
  if (denied) return denied

  try {
    const body = await req.json() as Record<string, string>
    const upserts = Object.entries(body).map(([key, value]) =>
      prisma.setting.upsert({
        where: { key },
        update: { value },
        create: { key, value },
      })
    )
    await Promise.all(upserts)
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: "Failed to save settings" }, { status: 500 })
  }
}
