import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase-server'

export async function GET(req: Request) {
  const url = new URL(req.url)
  const state = url.searchParams.get('state') // UI state
  const page = Number(url.searchParams.get('page') || '1')
  const pageSize = Number(url.searchParams.get('page_size') || '50')
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  const supabase = await createSupabaseServerClient()
  let query = supabase
    .from('ingestions')
    .select(
      'ingestion_id, org_id, created_at, status, approval_status, approval_mode, bill_payload_draft, error, invoices ( invoice_id, vendor_name, grand_total, bill_number, bill_date )',
      { count: 'exact' }
    )
    .order('created_at', { ascending: false })
    .range(from, to)

  if (state && state !== 'All') {
    const s = state.toLowerCase()
    if (s === 'ready') {
      query = query.eq('approval_status', 'ready').not('bill_payload_draft', 'is', null)
    } else {
      query = query.eq('status', s)
    }
  }

  const { data, error, count } = await query
  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 })

  type Row = {
    ingestion_id: number
    org_id: string
    created_at: string
    status: string
    approval_status: string
    approval_mode: string
    bill_payload_draft: unknown
    error: unknown
    invoices?: Array<{ vendor_name: string | null; grand_total: number | null; bill_number: string | null; bill_date: string | null }>
  }
  const rows: Row[] = ((data as Row[] | null) || [])

  // Extract draft vendor_ids grouped by org for name resolution
  const byOrg: Record<string, Set<string>> = {}
  const draftsMeta = rows.map((r) => {
    const draft = (r.bill_payload_draft as unknown) as { vendor_id?: string; bill_number?: string } | null | undefined
    const vendorId = draft?.vendor_id as string | undefined
    const billNo = (draft?.bill_number as string | undefined) || null
    if (vendorId) {
      if (!byOrg[r.org_id]) byOrg[r.org_id] = new Set<string>()
      byOrg[r.org_id].add(vendorId)
    }
    return { org_id: r.org_id, vendor_id: vendorId || null, bill_number_draft: billNo }
  })

  const vendorNameMap: Record<string, string> = {}
  await Promise.all(
    Object.entries(byOrg).map(async ([org, set]) => {
      const ids = Array.from(set)
      if (!ids.length) return
      const { data: vendors } = await supabase
        .from('vendors')
        .select('org_id, vendor_id, name')
        .eq('org_id', org)
        .in('vendor_id', ids)
      for (const v of vendors || []) {
        vendorNameMap[`${v.org_id}:${v.vendor_id}`] = v.name || ''
      }
    })
  )

  const items = rows.map((r, i) => {
    const dv = draftsMeta[i]
    const vendorNameFromDraft = dv.vendor_id ? vendorNameMap[`${r.org_id}:${dv.vendor_id}`] : undefined
    return {
      id: r.ingestion_id,
      created_at: r.created_at,
      state: computeUiState(r.status, r.approval_status, r.bill_payload_draft),
      approval_mode: r.approval_mode,
      ingestion_status: r.status,
      approval_status: r.approval_status,
      vendor_guess: vendorNameFromDraft ?? r.invoices?.[0]?.vendor_name ?? null,
      total_guess: r.invoices?.[0]?.grand_total ?? null,
      bill_number: dv.bill_number_draft ?? r.invoices?.[0]?.bill_number ?? null,
      error: r.error ? String(r.error as unknown as string) : null,
    }
  })

  return NextResponse.json({ items, count })
}

function computeUiState(status: string, approval: string, draft: unknown) {
  if (approval === 'ready' && draft) return 'Ready'
  switch ((status || '').toLowerCase()) {
    case 'queued':
      return 'Queued'
    case 'extracting':
      return 'Extracting'
    case 'matched':
      return 'Matched'
    case 'posting':
      return 'Posting'
    case 'billed':
      return 'Billed'
    case 'failed':
      return 'Failed'
    default:
      return 'Queued'
  }
}
