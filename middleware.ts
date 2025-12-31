import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname

  // ============================================
  // Player Routes (/player/*)
  // ============================================
  if (pathname.startsWith('/player')) {
    const playerCookie = request.cookies.get('player-auth')
    const isPlayerLoginPage = pathname === '/player/login'

    // Allow access to player login page
    if (isPlayerLoginPage) {
      // If already authenticated, redirect to dashboard
      if (playerCookie?.value) {
        try {
          JSON.parse(playerCookie.value) // Validate cookie format
          return NextResponse.redirect(new URL('/player/dashboard', request.url))
        } catch {
          // Invalid cookie, let them login
        }
      }
      return NextResponse.next()
    }

    // Protect all other player routes
    if (!playerCookie?.value) {
      return NextResponse.redirect(new URL('/player/login', request.url))
    }

    // Validate cookie format
    try {
      const data = JSON.parse(playerCookie.value)
      if (!data.playerId || !data.characterId) {
        return NextResponse.redirect(new URL('/player/login', request.url))
      }
    } catch {
      return NextResponse.redirect(new URL('/player/login', request.url))
    }

    return NextResponse.next()
  }

  // ============================================
  // DM Routes (everything else)
  // ============================================
  const dmCookie = request.cookies.get('dm-auth')
  const isDMLoginPage = pathname === '/login'

  // If already authenticated or on login page, continue
  if (dmCookie?.value === process.env.AUTH_SECRET || isDMLoginPage) {
    // If authenticated and trying to access login, redirect to home
    if (dmCookie?.value === process.env.AUTH_SECRET && isDMLoginPage) {
      return NextResponse.redirect(new URL('/', request.url))
    }
    return NextResponse.next()
  }

  // Redirect to DM login
  return NextResponse.redirect(new URL('/login', request.url))
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - api routes
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}
