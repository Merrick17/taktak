import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import bcrypt from "bcryptjs"
import { createSessionToken, sessionCookie } from "@/lib/session-token"
import { rateLimit } from "@/lib/rate-limit"

export async function POST(req: Request) {
  try {
    const throttle = rateLimit(req, "auth:register", 5, 60_000)
    if (!throttle.ok) {
      return NextResponse.json(
        { error: "Too many registration attempts. Please try again later." },
        { status: 429, headers: { "Retry-After": String(throttle.retryAfterSeconds) } }
      )
    }

    const { email, password, firstName, lastName } = await req.json()
    if (
      typeof email !== "string" ||
      typeof password !== "string" ||
      password.length < 8 ||
      !email.trim()
    ) {
      return NextResponse.json({ error: "Invalid registration payload" }, { status: 400 })
    }
    const hashed = await bcrypt.hash(password, 10)
    const user = await prisma.user.create({
      data: {
        email,
        password: hashed,
        firstName,
        lastName,
        role: "customer",
      },
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

    const token = await createSessionToken(user.id, user.role ?? "customer")
    const res = NextResponse.json(user, { status: 201 })
    res.cookies.set(sessionCookie.name, token, sessionCookie.options)
    return res
  } catch (error: unknown) {
    const err = error as { code?: string }
    if (err?.code === "P2002") {
      return NextResponse.json({ error: "Email already exists" }, { status: 409 })
    }
    return NextResponse.json({ error: "Failed to create user" }, { status: 500 })
  }
}
