import { NextResponse, type NextRequest } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase-server'

type Ctx = { params: Promise<{ id: string }> }

export async function POST(_req: NextRequest, ctx: Ctx) {
  const { id: idStr } = await ctx.params
  const ingestionId = Number(idStr)
  if (!Number.isFinite(ingestionId)) return NextResponse.json({ ok: false, error: 'invalid id' }, { status: 400 })

  const supabase = await createSupabaseServerClient({ allowCookieWrite: true })

  // Load ingestion + invoice
  const { data: ing, error: e1 } = await supabase
    .from('ingestions')
    .select('ingestion_id, bill_payload_draft, approval_status')
    .eq('ingestion_id', ingestionId)
    .maybeSingle()
  if (e1 || !ing) return NextResponse.json({ ok: false, error: 'ingestion not found' }, { status: 404 })

  const { data: inv, error: e2 } = await supabase
    .from('invoices')
    .select('invoice_id')
    .eq('ingestion_id', ingestionId)
    .maybeSingle()
  if (e2 || !inv) return NextResponse.json({ ok: false, error: 'invoice not found' }, { status: 404 })

  const { data: lines, error: e3 } = await supabase
    .from('invoice_lines')
    .select('match_state')
    .eq('invoice_id', inv.invoice_id)
  if (e3) return NextResponse.json({ ok: false, error: e3.message }, { status: 500 })

  const unmatched = (lines || []).filter((l) => (l.match_state || '') === 'unmatched').length
  if (unmatched > 0) {
    return NextResponse.json({ ok: false, error: 'unmatched lines remain', counts: { unmatched } }, { status: 400 })
  }
  if (!ing.bill_payload_draft) {
    return NextResponse.json({ ok: false, error: 'no draft payload' }, { status: 400 })
  }

  const { error: e4 } = await supabase
    .from('ingestions')
    .update({ approval_status: 'ready' })
    .eq('ingestion_id', ingestionId)
  if (e4) return NextResponse.json({ ok: false, error: e4.message }, { status: 500 })

  return NextResponse.json({ ok: true, approval_status: 'ready' })
}

