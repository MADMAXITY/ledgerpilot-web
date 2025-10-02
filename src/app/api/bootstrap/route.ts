import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase-server'

export async function GET() {
  const supabase = await createSupabaseServerClient({ allowCookieWrite: true })
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ ok: false }, { status: 401 })

  // find profile
  const { data: profile, error: profErr } = await supabase
    .from('profiles')
    .select('org_id')
    .eq('user_id', user.id)
    .maybeSingle()

  if (profErr) {
    console.error('bootstrap: profile fetch error', profErr)
  }

  if (profile?.org_id) {
    return NextResponse.json({ ok: true, org_id: profile.org_id })
  }

  // create org
  const orgId = `org_${Math.random().toString(36).slice(2, 10)}`
  const { error: orgErr } = await supabase.from('orgs').insert({ org_id: orgId }).select().single()
  if (orgErr) {
    console.error('bootstrap: org insert error', orgErr)
    return NextResponse.json({ ok: false }, { status: 500 })
  }

  // create profile
  const { error: profileErr } = await supabase
    .from('profiles')
    .insert({ user_id: user.id, org_id: orgId })
    .select()
    .single()

  if (profileErr) {
    console.error('bootstrap: profile insert error', profileErr)
    return NextResponse.json({ ok: false }, { status: 500 })
  }

  return NextResponse.json({ ok: true, org_id: orgId })
}
