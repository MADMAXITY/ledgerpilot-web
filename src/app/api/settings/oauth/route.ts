import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase-server'

export async function GET() {
  const supabase = await createSupabaseServerClient({ allowCookieWrite: true })
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ ok: false }, { status: 401 })

  const { data: profile } = await supabase.from('profiles').select('org_id').eq('user_id', user.id).maybeSingle()
  if (!profile?.org_id) return NextResponse.json({ ok: true, oauth: null })

  const { data: token } = await supabase
    .from('oauth_tokens')
    .select('org_id, provider, updated_at, client_id, client_secret, refresh_token')
    .eq('org_id', profile.org_id)
    .maybeSingle()

  return NextResponse.json({ ok: true, oauth: token || null })
}

export async function POST(req: Request) {
  const supabase = await createSupabaseServerClient({ allowCookieWrite: true })
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ ok: false }, { status: 401 })

  const body = (await req.json().catch(() => ({}))) as {
    client_id?: string
    client_secret?: string
    refresh_token?: string
  }

  const { data: profile } = await supabase.from('profiles').select('org_id').eq('user_id', user.id).maybeSingle()
  if (!profile?.org_id) return NextResponse.json({ ok: false, error: 'org not found' }, { status: 400 })

  const { data: existing } = await supabase.from('oauth_tokens').select('org_id').eq('org_id', profile.org_id).maybeSingle()

  if (!existing) {
    const { error: insErr } = await supabase.from('oauth_tokens').insert({
      org_id: profile.org_id,
      provider: 'zoho',
      client_id: body.client_id || '',
      client_secret: body.client_secret || '',
      // placeholder when not provided; webhook will fill real token
      refresh_token: body.refresh_token ?? '',
    })
    if (insErr) return NextResponse.json({ ok: false, error: insErr.message }, { status: 500 })
  } else {
    const patch: Record<string, string> = {}
    if (body.client_id != null) patch.client_id = body.client_id
    if (body.client_secret != null) patch.client_secret = body.client_secret
    if (body.refresh_token != null) patch.refresh_token = body.refresh_token
    if (Object.keys(patch).length === 0)
      return NextResponse.json({ ok: false, error: 'no fields to update' }, { status: 400 })

    const { error: upErr } = await supabase
      .from('oauth_tokens')
      .update(patch)
      .eq('org_id', profile.org_id)
    if (upErr) return NextResponse.json({ ok: false, error: upErr.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
