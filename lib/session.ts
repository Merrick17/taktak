import { cookies } from "next/headers"
import {
  createSessionToken,
  verifySessionToken,
  sessionCookie,
  type SessionPayload,
} from "@/lib/session-token"

export { createSessionToken, verifySessionToken, sessionCookie, type SessionPayload }

export async function getServerSession(): Promise<{ userId: string; role: string } | null> {
  const jar = await cookies()
  const token = jar.get(sessionCookie.name)?.value
  if (!token) return null
  const payload = await verifySessionToken(token)
  const userId = payload?.sub
  if (!userId || typeof userId !== "string") return null
  const role = typeof payload.role === "string" ? payload.role : "customer"
  return { userId, role }
}
