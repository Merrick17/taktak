import { NextResponse } from "next/server"
import { getServerSession } from "@/lib/session"

/** Returns null if authorized as admin; otherwise a NextResponse to return. */
export async function requireAdminResponse(): Promise<NextResponse | null> {
  const session = await getServerSession()
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  if (session.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }
  return null
}
