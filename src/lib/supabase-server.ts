import { type CookieOptions, createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

type Options = { allowCookieWrite?: boolean }

export async function createSupabaseServerClient(opts: Options = {}) {
  const cookieStore = await cookies()
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  return createServerClient(url, anon, {
    cookies: {
      get: (name: string) => cookieStore.get(name)?.value,
      set: (name: string, value: string, options: CookieOptions) => {
        if (opts.allowCookieWrite) cookieStore.set({ name, value, ...options })
      },
      remove: (name: string, options: CookieOptions) => {
        if (opts.allowCookieWrite) cookieStore.set({ name, value: '', ...options })
      },
    },
  })
}

// Server-only admin client using service role key. Never expose to browser.
export async function createSupabaseAdminServerClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!serviceKey) throw new Error('SUPABASE_SERVICE_ROLE_KEY not set')
  // No cookie handling needed for admin operations
  return createServerClient(url, serviceKey, {
    cookies: {
      get: () => undefined,
      set: () => {},
      remove: () => {},
    },
  })
}
