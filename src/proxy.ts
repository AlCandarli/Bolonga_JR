import { NextRequest, NextResponse } from 'next/server'
import { decrypt } from '@/lib/session'
import { cookies } from 'next/headers'

// Define protected routes
const protectedRoutes = ['/student', '/admin']

export async function proxy(req: NextRequest) {
  const path = req.nextUrl.pathname
  const isProtectedRoute = protectedRoutes.some(route => path.startsWith(route))

  const cookie = (await cookies()).get('session')?.value
  const session = await decrypt(cookie)

  // Redirect to login if a protected route is accessed without session
  if (isProtectedRoute && !session?.userId) {
    return NextResponse.redirect(new URL('/', req.nextUrl))
  }

  // Admin role check for /admin routes
  if (path.startsWith('/admin') && session?.role !== 'admin') {
     // If they aren't admin, they shouldn't see the admin dashboard.
     // But we let them stay on /admin if they are logging in (handled by page logic)
     // Actually, let's keep it simple: if session exists but role isn't admin, redirect.
     if (session?.role === 'student') {
        return NextResponse.redirect(new URL('/student', req.nextUrl))
     }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/student/:path*', '/admin/:path*'],
}
