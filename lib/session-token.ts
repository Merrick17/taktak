import { SignJWT, jwtVerify, type JWTPayload } from "jose"

export const sessionCookie = {
  name: "session",
  options: {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 14,
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

export interface SessionPayload extends JWTPayload {
  role?: string
}

export async function createSessionToken(userId: string, role: string): Promise<string> {
  return new SignJWT({ role })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(userId)
    .setIssuedAt()
    .setExpirationTime("14d")
    .sign(getSecretKey())
}

export async function verifySessionToken(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecretKey(), { algorithms: ["HS256"] })
    return payload as SessionPayload
  } catch {
    return null
  }
}
