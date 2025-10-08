import { NextResponse, type NextRequest } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase-server'

type Ctx = { params: Promise<{ id: string; lineId: string }> }

export async function POST(req: NextRequest, ctx: Ctx) {
  const { id: idStr, lineId: lineIdStr } = await ctx.params
  const ingestionId = Number(idStr)
  const lineId = Number(lineIdStr)
  if (!Number.isFinite(ingestionId) || !Number.isFinite(lineId)) {
    return NextResponse.json({ ok: false, error: 'invalid params' }, { status: 400 })
  }
  const body = (await req.json().catch(() => null)) as { item_id?: string | null } | null
  const itemId = (body?.item_id ?? null) as string | null
  if (!itemId || typeof itemId !== 'string') {
    return NextResponse.json({ ok: false, error: 'item_id required' }, { status: 400 })
  }

  const supabase = await createSupabaseServerClient({ allowCookieWrite: true })

  // 1) Fetch line -> get invoice_id and line_no
  const { data: line, error: e1 } = await supabase
    .from('invoice_lines')
    .select('line_id, invoice_id, line_no, match_state, item_id')
    .eq('line_id', lineId)
    .maybeSingle()
  if (e1 || !line) return NextResponse.json({ ok: false, error: 'line not found' }, { status: 404 })

  // 2) Ensure ingestion matches and get org_id
  const { data: inv, error: e2 } = await supabase
    .from('invoices')
    .select('invoice_id, ingestion_id, org_id')
    .eq('invoice_id', line.invoice_id)
    .maybeSingle()
  if (e2 || !inv) return NextResponse.json({ ok: false, error: 'invoice not found' }, { status: 404 })
  if (inv.ingestion_id !== ingestionId)
    return NextResponse.json({ ok: false, error: 'ingestion/line mismatch' }, { status: 400 })

  // 3) Update the invoice line with selected item
  const { error: e3 } = await supabase
    .from('invoice_lines')
    .update({ item_id: itemId, match_state: 'human_matched' })
    .eq('line_id', lineId)
  if (e3) return NextResponse.json({ ok: false, error: e3.message }, { status: 500 })

  // 4) Patch the draft payload at the corresponding line index
  const { data: ing, error: e4 } = await supabase
    .from('ingestions')
    .select('bill_payload_draft')
    .eq('ingestion_id', ingestionId)
    .maybeSingle()
  if (e4 || !ing) return NextResponse.json({ ok: false, error: 'ingestion not found' }, { status: 404 })

  const draft = (ing.bill_payload_draft as unknown) as {
    line_items?: Array<Record<string, unknown>>
  } | null
  const idx = Math.max(0, (line.line_no || 1) - 1)
  const updatedDraft = draft || { line_items: [] }
  const arr = Array.isArray(updatedDraft.line_items) ? updatedDraft.line_items : []
  // ensure array length
  while (arr.length <= idx) arr.push({})
  const li = { ...(arr[idx] || {}) }
  li['item_id'] = itemId
  arr[idx] = li
  updatedDraft.line_items = arr

  const { error: e5 } = await supabase
    .from('ingestions')
    .update({ bill_payload_draft: updatedDraft })
    .eq('ingestion_id', ingestionId)
  if (e5) return NextResponse.json({ ok: false, error: e5.message }, { status: 500 })

  // 5) Counts for UI gating
  const { data: lines, error: e6 } = await supabase
    .from('invoice_lines')
    .select('match_state')
    .eq('invoice_id', line.invoice_id)
  if (e6) return NextResponse.json({ ok: false, error: e6.message }, { status: 500 })
  const counts = {
    unmatched: (lines || []).filter((l) => (l.match_state || '') === 'unmatched').length,
    to_create: (lines || []).filter((l) => (l.match_state || '') === 'to_create').length,
  }
  return NextResponse.json({ ok: true, counts })
}
