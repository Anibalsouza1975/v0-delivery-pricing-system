import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (pathname === "/") {
    // Check if it's likely a direct browser access (not an API call or authenticated session)
    const userAgent = request.headers.get("user-agent") || ""
    const isBot = /bot|crawler|spider|crawling/i.test(userAgent)

    // If it's not a bot and no admin session, redirect to customer menu
    if (!isBot) {
      const adminAuth = request.cookies.get("admin_auth")
      if (!adminAuth) {
        return NextResponse.redirect(new URL("/m/cb2024", request.url))
      }
    }
  }

  if (pathname.startsWith("/admin") || pathname.startsWith("/dashboard")) {
    const adminAuth = request.cookies.get("admin_auth")
    if (!adminAuth) {
      return NextResponse.redirect(new URL("/m/cb2024", request.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|m/).*)"],
}
