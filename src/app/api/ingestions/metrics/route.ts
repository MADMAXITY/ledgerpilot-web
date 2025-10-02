import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase-server'

export async function GET() {
  const supabase = await createSupabaseServerClient({ allowCookieWrite: true })

  try {
    const now = new Date()
    const d30 = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    const d30Iso = d30.toISOString()

    const billed30Q = supabase
      .from('ingestions')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'billed')
      .gte('created_at', d30Iso)
    const billedTotalQ = supabase
      .from('ingestions')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'billed')
    const readyQ = supabase
      .from('ingestions')
      .select('*', { count: 'exact', head: true })
      .eq('approval_status', 'ready')
      .not('bill_payload_draft', 'is', null)
    const failedQ = supabase.from('ingestions').select('*', { count: 'exact', head: true }).eq('status', 'failed')

    const [{ count: billed_30d, error: e1 }, { count: billed_total, error: e2 }, { count: ready_count, error: e3 }, { count: failed_count, error: e4 }] =
      await Promise.all([billed30Q, billedTotalQ, readyQ, failedQ])

    const err = e1 || e2 || e3 || e4
    if (err) throw new Error(err.message)

    return NextResponse.json({
      billed_30d: billed_30d || 0,
      billed_total: billed_total || 0,
      ready_count: ready_count || 0,
      failed_count: failed_count || 0,
    })
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'metrics error'
    return NextResponse.json({ ok: false, error: msg }, { status: 500 })
  }
}
