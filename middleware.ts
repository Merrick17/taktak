import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { verifySessionToken, sessionCookie } from "@/lib/session-token"

export async function middleware(request: NextRequest) {
  const token = request.cookies.get(sessionCookie.name)?.value
  const { pathname } = request.nextUrl

  if (pathname.startsWith("/admin")) {
    if (!token) {
      const url = request.nextUrl.clone()
      url.pathname = "/login"
      url.searchParams.set("next", pathname)
      return NextResponse.redirect(url)
    }
    const payload = await verifySessionToken(token)
    const role = typeof payload?.role === "string" ? payload.role : "customer"
    if (role !== "admin") {
      const url = request.nextUrl.clone()
      url.pathname = "/"
      url.searchParams.delete("next")
      return NextResponse.redirect(url)
    }
  }

  if (pathname.startsWith("/account")) {
    if (!token) {
      const url = request.nextUrl.clone()
      url.pathname = "/login"
      url.searchParams.set("next", pathname)
      return NextResponse.redirect(url)
    }
    const payload = await verifySessionToken(token)
    if (!payload?.sub) {
      const url = request.nextUrl.clone()
      url.pathname = "/login"
      url.searchParams.set("next", pathname)
      return NextResponse.redirect(url)
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/admin/:path*", "/account/:path*"],
}
