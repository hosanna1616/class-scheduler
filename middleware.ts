import { auth } from "@/auth"
import { NextResponse } from "next/server"

export default auth((req) => {
  const token = req.auth
  const pathname = req.nextUrl.pathname
  
  // Allow access to login pages
  if (pathname === "/login" || pathname === "/teacher/login") {
    return NextResponse.next()
  }

  const isAdminRoute = pathname.startsWith("/admin")
  const isTeacherRoute = pathname.startsWith("/teacher")

  // Protect admin routes
  if (isAdminRoute) {
    if (!token || token.user?.role !== "ADMIN") {
      return NextResponse.redirect(new URL("/login", req.url))
    }
  }

  // Protect teacher routes (except login)
  if (isTeacherRoute) {
    if (!token || token.user?.role !== "TEACHER") {
      return NextResponse.redirect(new URL("/teacher/login", req.url))
    }
  }

  return NextResponse.next()
})

export const config = {
  matcher: ["/admin/:path*", "/teacher/:path*", "/login"],
}


