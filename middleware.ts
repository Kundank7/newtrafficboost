import { createMiddlewareClient } from "@supabase/auth-helpers-nextjs"
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  const supabase = createMiddlewareClient({ req, res })

  const {
    data: { session },
  } = await supabase.auth.getSession()

  // Check if the request is for the admin area
  const isAdminRoute = req.nextUrl.pathname.startsWith("/admin-access")

  // If accessing admin routes, check if user is admin
  if (isAdminRoute && req.nextUrl.pathname !== "/admin-access") {
    if (!session) {
      return NextResponse.redirect(new URL("/admin-access", req.url))
    }

    // Check if user has admin role
    const { data: profile } = await supabase.from("profiles").select("role").eq("id", session.user.id).single()

    if (!profile || profile.role !== "admin") {
      return NextResponse.redirect(new URL("/admin-access", req.url))
    }
  }

  // For user dashboard routes, redirect to login if not authenticated
  if (req.nextUrl.pathname.startsWith("/dashboard") && !session) {
    return NextResponse.redirect(new URL("/", req.url))
  }

  // If user is logged in and tries to access login page, redirect to dashboard
  if (req.nextUrl.pathname === "/" && session) {
    return NextResponse.redirect(new URL("/dashboard", req.url))
  }

  return res
}

export const config = {
  matcher: ["/", "/dashboard/:path*", "/admin-access/:path*"],
}
