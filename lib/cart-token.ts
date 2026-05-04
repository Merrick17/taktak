import { SignJWT, jwtVerify } from "jose"
import { cookies } from "next/headers"

export const cartCookie = {
  name: "cart",
  options: {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  },
}

function getSecretKey(): Uint8Array {
  const secret = process.env.SESSION_SECRET
  if (!secret || secret.length < 16) {
    if (process.env.NODE_ENV !== "production") {
      return new TextEncoder().encode("__development_session_secret_minimum_32__")
    }
    throw new Error("SESSION_SECRET must be set and at least 16 characters")
  }
  return new TextEncoder().encode(secret)
}

export async function createCartToken(cartId: string): Promise<string> {
  return new SignJWT({})
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(cartId)
    .setIssuedAt()
    .setExpirationTime("30d")
    .sign(getSecretKey())
}

export async function getCartIdFromCookie(): Promise<string | null> {
  const jar = await cookies()
  const token = jar.get(cartCookie.name)?.value
  if (!token) return null
  try {
    const { payload } = await jwtVerify(token, getSecretKey(), { algorithms: ["HS256"] })
    const cartId = payload.sub
    return typeof cartId === "string" ? cartId : null
  } catch {
    return null
  }
}
