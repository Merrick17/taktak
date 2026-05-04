import { NextResponse } from "next/server"
import { sessionCookie } from "@/lib/session-token"

export async function POST() {
  const res = NextResponse.json({ success: true })
  res.cookies.set(sessionCookie.name, "", { ...sessionCookie.options, maxAge: 0 })
  return res
}
