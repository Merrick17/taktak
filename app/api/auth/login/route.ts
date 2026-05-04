import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import bcrypt from "bcryptjs"
import { createSessionToken, sessionCookie } from "@/lib/session-token"
import { rateLimit } from "@/lib/rate-limit"

function isBcryptHash(s: string) {
  return s.startsWith("$2a$") || s.startsWith("$2b$") || s.startsWith("$2y$")
}

export async function POST(req: Request) {
  try {
    const throttle = rateLimit(req, "auth:login", 10, 60_000)
    if (!throttle.ok) {
      return NextResponse.json(
        { error: "Too many login attempts. Please try again later." },
        { status: 429, headers: { "Retry-After": String(throttle.retryAfterSeconds) } }
      )
    }

    const { email, password } = await req.json()
    if (typeof email !== "string" || typeof password !== "string" || !email || !password) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 400 })
    }
    const user = await prisma.user.findUnique({ where: { email } })
    if (!user) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 })
    }

    let valid = false
    if (isBcryptHash(user.password)) {
      valid = await bcrypt.compare(password, user.password)
    } else {
      valid = user.password === password
      if (valid) {
        const hashed = await bcrypt.hash(password, 10)
        await prisma.user.update({ where: { id: user.id }, data: { password: hashed } })
      }
    }

    if (!valid) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 })
    }

    const token = await createSessionToken(user.id, user.role ?? "customer")
    const safeUser = {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    }

    const res = NextResponse.json(safeUser)
    res.cookies.set(sessionCookie.name, token, sessionCookie.options)
    return res
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
