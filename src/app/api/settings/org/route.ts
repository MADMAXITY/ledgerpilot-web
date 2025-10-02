import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase-server'

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}))
  const org_id = (body?.org_id as string | undefined)?.trim()
  if (!org_id) return NextResponse.json({ ok: false, error: 'org_id required' }, { status: 400 })

  const supabase = await createSupabaseServerClient({ allowCookieWrite: true })
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ ok: false }, { status: 401 })

  // Ensure org exists (no-op if already present)
  const { error: upOrgErr } = await supabase.from('orgs').upsert({ org_id })
  if (upOrgErr) return NextResponse.json({ ok: false, error: upOrgErr.message }, { status: 500 })

  // Bind user profile to org
  const { error: profErr } = await supabase.from('profiles').upsert({ user_id: user.id, org_id })
  if (profErr) return NextResponse.json({ ok: false, error: profErr.message }, { status: 500 })

  return NextResponse.json({ ok: true, org_id })
}
