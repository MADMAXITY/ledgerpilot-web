import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase-server'

type Ctx = { params: Promise<{ id: string }> }

export async function GET(req: Request, ctx: Ctx) {
  const { id: idStr } = await ctx.params
  const ingestionId = Number(idStr)
  if (!Number.isFinite(ingestionId)) return NextResponse.json({ ok: false, error: 'invalid id' }, { status: 400 })
  const url = new URL(req.url)
  const q = (url.searchParams.get('q') || '').trim()
  const limit = Math.max(1, Math.min(50, Number(url.searchParams.get('limit') || '20')))
  const offset = Math.max(0, Number(url.searchParams.get('offset') || '0'))

  const supabase = await createSupabaseServerClient({ allowCookieWrite: true })
  // Resolve org via ingestion -> invoice
  const { data: inv, error: e1 } = await supabase
    .from('invoices')
    .select('org_id, invoice_id, ingestion_id')
    .eq('ingestion_id', ingestionId)
    .maybeSingle()
  if (e1 || !inv) return NextResponse.json({ ok: false, error: 'ingestion not found' }, { status: 404 })

  let base = supabase
    .from('items_catalog_duplicate')
    .select('item_id, name, hsn8, sku')
    .eq('org_id', inv.org_id)
    .order('name', { ascending: true })
    .range(offset, offset + limit - 1)

  if (q) {
    // search by name or sku
    base = base.or(`name.ilike.%${q}%,sku.ilike.%${q}%`)
  }

  const { data, error } = await base
  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 })
  type ItemRow = { item_id: string; name: string | null; hsn8: string | null }
  const items = ((data || []) as ItemRow[]).map((d) => ({ item_id: d.item_id, name: d.name ?? null, hsn8: d.hsn8 ?? null }))
  return NextResponse.json({ ok: true, items, count: items.length })
}
