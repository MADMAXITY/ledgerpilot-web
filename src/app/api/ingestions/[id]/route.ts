import { NextResponse, type NextRequest } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase-server'

type Ctx = { params: Promise<{ id: string }> }

export async function GET(_req: NextRequest, ctx: Ctx) {
  const { id: idStr } = await ctx.params
  const id = Number(idStr)
  const supabase = await createSupabaseServerClient()

  const { data: ing, error } = await supabase
    .from('ingestions')
    .select('ingestion_id, created_at, status, approval_status, approval_mode, bill_payload_draft, error, file_id, org_id')
    .eq('ingestion_id', id)
    .maybeSingle()
  if (!ing || error) return NextResponse.json({ ok: false, error: 'not found' }, { status: 404 })

  let storage_key: string | null = null
  if (ing.file_id) {
    const { data: file } = await supabase.from('files').select('storage_key').eq('file_id', ing.file_id).maybeSingle()
    storage_key = file?.storage_key ?? null
  }

  const { data: inv } = await supabase
    .from('invoices')
    .select('invoice_id, vendor_name, vendor_gstin, bill_number, bill_date, grand_total, currency')
    .eq('ingestion_id', id)
    .maybeSingle()

  const { data: linesRaw } = await supabase
    .from('invoice_lines')
    .select('line_id, line_no, description, quantity, rate, amount, item_name, match_state, item_id')
    .in('invoice_id', inv ? [inv.invoice_id] : [-1])
    .order('line_no', { ascending: true })
  let lines = linesRaw || []
  // Resolve nicer item names for DB lines using items_catalog_duplicate by item_id
  try {
    const itemIds = Array.from(new Set(lines.map((l) => l.item_id).filter(Boolean))) as string[]
    if (itemIds.length) {
      const { data: cat } = await supabase
        .from('items_catalog_duplicate')
        .select('item_id, name')
        .eq('org_id', ing.org_id)
        .in('item_id', itemIds)
      const map: Record<string, string> = Object.fromEntries(((cat as Array<{ item_id: string; name: string | null }> | null) || []).map((c) => [c.item_id, c.name || '']))
      lines = lines.map((l) => ({ ...l, item_name: l.item_id && map[l.item_id] ? map[l.item_id] : l.item_name }))
    }
  } catch {
    // ignore
  }

  const counts = {
    to_create: (lines || []).filter((l) => l.match_state === 'to_create').length,
    unmatched: (lines || []).filter((l) => l.match_state === 'unmatched').length,
  }

  // Enrich bill_payload_draft with vendor name and item names
  const draft = (ing.bill_payload_draft as unknown) as
    | {
        vendor_id?: string
        date?: string
        due_date?: string
        bill_number?: string
        discount_type?: string
        is_item_level_tax_calc?: boolean
        line_items?: Array<{ item_id?: string; description?: string; hsn_or_sac?: string; quantity?: number; rate?: number; discount?: number; tax_id?: string }>
      }
    | null
    | undefined
  
  type DraftLine = { item_id?: string; description?: string; hsn_or_sac?: string; quantity?: number; rate?: number; discount?: number; tax_id?: string; item_name?: string | null }
  let draftVendorName: string | null = null
  let draftLineItems: DraftLine[] | null = null
  if (draft) {
    try {
      const vendorId: string | undefined = draft.vendor_id
      if (vendorId) {
        const { data: v } = await supabase
          .from('vendors')
          .select('name')
          .eq('org_id', ing.org_id)
          .eq('vendor_id', vendorId)
          .maybeSingle()
        draftVendorName = v?.name ?? null
      }
      const draftItems: Array<{ item_id?: string; description?: string; hsn_or_sac?: string; quantity?: number; rate?: number; discount?: number; tax_id?: string }> =
        Array.isArray(draft.line_items) ? draft.line_items : []
      const ids = Array.from(new Set(draftItems.map((d) => d.item_id).filter(Boolean) as string[]))
      let itemMap: Record<string, string> = {}
      if (ids.length) {
        const { data: items } = await supabase
          .from('items_catalog_duplicate')
          .select('item_id, name')
          .eq('org_id', ing.org_id)
          .in('item_id', ids)
        type It = { item_id: string; name: string | null }
        itemMap = Object.fromEntries((((items as unknown) as It[] | null) || []).map((i) => [i.item_id, i.name || '']))
      }
      draftLineItems = draftItems.map((li) => ({
        ...li,
        item_name: li.item_id ? itemMap[li.item_id] || null : null,
      }))
    } catch {
      // ignore draft enrichment errors
    }
  }

  return NextResponse.json({
    ok: true,
    ingestion: ing,
    storage_key,
    invoice: inv || null,
    lines: lines || [],
    counts,
    draft: draft
      ? {
          date: draft.date ?? null,
          due_date: draft.due_date ?? null,
          bill_number: draft.bill_number ?? null,
          discount_type: draft.discount_type ?? null,
          is_item_level_tax_calc: !!draft.is_item_level_tax_calc,
          vendor_id: draft.vendor_id ?? null,
          vendor_name: draftVendorName,
          line_items: draftLineItems || [],
        }
      : null,
  })
}
