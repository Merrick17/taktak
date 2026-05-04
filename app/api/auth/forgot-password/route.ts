import { NextResponse } from "next/server"
import { createHash, randomUUID } from "crypto"
import prisma from "@/lib/prisma"
import { sendPasswordReset } from "@/lib/mailer"
import { rateLimit } from "@/lib/rate-limit"

const TOKEN_TTL_MS = 1000 * 60 * 60 // 1 hour

export async function POST(req: Request) {
  try {
    const throttle = rateLimit(req, "auth:forgot", 5, 60_000)
    if (!throttle.ok) {
      return NextResponse.json(
        { error: "Too many reset requests. Please try again later." },
        { status: 429, headers: { "Retry-After": String(throttle.retryAfterSeconds) } }
      )
    }

    const { email } = await req.json()
    if (!email || typeof email !== "string") {
      return NextResponse.json({ error: "البريد الإلكتروني مطلوب" }, { status: 400 })
    }

    const user = await prisma.user.findUnique({ where: { email: email.trim().toLowerCase() } })
    if (user) {
      const token = randomUUID()
      const tokenHash = createHash("sha256").update(token).digest("hex")
      const expiry = new Date(Date.now() + TOKEN_TTL_MS)
      await prisma.user.update({
        where: { id: user.id },
        data: { resetToken: tokenHash, resetTokenExpiry: expiry },
      })
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"
      await sendPasswordReset(user.email, `${baseUrl}/reset-password/${token}`)
    }

    return NextResponse.json({
      message: "إذا كان البريد مسجلاً، ستصل رسالة إعادة التعيين خلال دقائق.",
    })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: "فشل إرسال الطلب" }, { status: 500 })
  }
}
