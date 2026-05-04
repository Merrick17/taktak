import { NextResponse } from "next/server"
import { createHash } from "crypto"
import bcrypt from "bcryptjs"
import prisma from "@/lib/prisma"
import { rateLimit } from "@/lib/rate-limit"

export async function POST(req: Request) {
  try {
    const throttle = rateLimit(req, "auth:reset", 10, 60_000)
    if (!throttle.ok) {
      return NextResponse.json(
        { error: "Too many attempts. Please try again later." },
        { status: 429, headers: { "Retry-After": String(throttle.retryAfterSeconds) } }
      )
    }

    const { token, password } = await req.json()
    if (!token || !password || typeof token !== "string" || typeof password !== "string") {
      return NextResponse.json({ error: "بيانات غير صالحة" }, { status: 400 })
    }
    if (password.length < 8) {
      return NextResponse.json({ error: "كلمة المرور يجب أن تكون 8 أحرف على الأقل" }, { status: 400 })
    }

    const tokenHash = createHash("sha256").update(token).digest("hex")
    const user = await prisma.user.findUnique({ where: { resetToken: tokenHash } })
    if (!user || !user.resetTokenExpiry || user.resetTokenExpiry < new Date()) {
      return NextResponse.json({ error: "الرابط غير صالح أو منتهي الصلاحية" }, { status: 400 })
    }

    const hashed = await bcrypt.hash(password, 10)
    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashed, resetToken: null, resetTokenExpiry: null },
    })

    return NextResponse.json({ message: "تم تغيير كلمة المرور بنجاح" })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: "فشل تغيير كلمة المرور" }, { status: 500 })
  }
}
