import { NextResponse, type NextRequest } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase-server'

export async function GET(req: NextRequest) {
  const url = new URL(req.url)
  const code = url.searchParams.get('code')
  if (code) {
    const supabase = await createSupabaseServerClient()
    // Exchange the code and set auth cookies. Different lib versions support
    // different overloads; attempt both without failing the request.
    type AuthLike = { exchangeCodeForSession: (input: string) => Promise<unknown> }
    const authAny = (supabase as unknown as { auth: AuthLike }).auth
    try {
      await authAny.exchangeCodeForSession(code)
    } catch {
      await authAny.exchangeCodeForSession(req.url)
    }
  }
  return NextResponse.redirect(new URL('/', req.url))
}
