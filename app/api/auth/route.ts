import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const { password } = await request.json()

  // Check password against env variable
  if (password === process.env.DM_PASSWORD) {
    const response = NextResponse.json({ success: true })

    // Set auth cookie (expires in 30 days)
    response.cookies.set('dm-auth', process.env.AUTH_SECRET!, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 30, // 30 days
    })

    return response
  }

  return NextResponse.json({ error: 'Invalid password' }, { status: 401 })
}
