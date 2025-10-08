import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase-server'

type Ctx = { params: Promise<{ lineId: string }> }

export async function GET(req: Request, ctx: Ctx) {
  const { lineId: lineIdStr } = await ctx.params
  const lineId = Number(lineIdStr)
  if (!Number.isFinite(lineId)) return NextResponse.json({ ok: false, error: 'invalid lineId' }, { status: 400 })
  const url = new URL(req.url)
  const top = Math.max(1, Math.min(20, Number(url.searchParams.get('top') || '5')))
  const supabase = await createSupabaseServerClient({ allowCookieWrite: true })

  // Ensure line exists and fetch invoice/org context
  const { data: line, error: e1 } = await supabase
    .from('invoice_lines')
    .select('line_id, invoice_id')
    .eq('line_id', lineId)
    .maybeSingle()
  if (e1 || !line) return NextResponse.json({ ok: false, error: 'line not found' }, { status: 404 })

  const { data: items, error: e2 } = await supabase
    .from('invoice_line_match_candidates')
    .select('candidate_item_id, candidate_name, hsn8, similarity, reason, rank')
    .eq('line_id', lineId)
    .order('rank', { ascending: true })
    .order('similarity', { ascending: false })
    .limit(top)
  if (e2) return NextResponse.json({ ok: false, error: e2.message }, { status: 500 })

  return NextResponse.json({ ok: true, items: items || [], count: (items || []).length })
}

