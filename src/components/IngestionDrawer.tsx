"use client"

import { useEffect, useState, useCallback, useRef } from 'react'
import { Box, Chip, Divider, Drawer, IconButton, Stack, Typography, Paper, Skeleton, Link as MuiLink } from '@mui/material'
import BillViewerDrawer from './BillViewerDrawer'
import CloseIcon from '@mui/icons-material/Close'
import { useSnackbar } from 'notistack'
import { apiFetch } from '@/lib/api'
import ReviewHeader from './ReviewHeader'
import RejectDialog from './RejectDialog'
// Removed Lines section (redundant); only Draft shows line details
import LineResolver from './LineResolver'
// interactive line resolver is only shown in Draft section

type Detail = {
  ok: boolean
  ingestion: { ingestion_id: number; created_at: string; status?: string; approval_mode?: string; approval_status?: string; error?: unknown }
  storage_key: string | null
  invoice: { invoice_id: number; vendor_name: string; bill_number: string; bill_date: string; grand_total: number; currency: string } | null
  lines: Array<{
    line_id: number
    line_no: number
    description: string | null
    quantity: number | null
    rate: number | null
    amount: number | null
    item_name: string | null
    match_state: string
    item_id?: string | null
  }>
  counts: { to_create: number; unmatched: number }
  draft: {
    date: string | null
    due_date: string | null
    bill_number: string | null
    discount_type: string | null
    is_item_level_tax_calc: boolean
    vendor_id: string | null
    vendor_name: string | null
    line_items: Array<{ item_id?: string; item_name?: string | null; description?: string | null; quantity?: number; rate?: number; discount?: number; tax_id?: string; hsn_or_sac?: string }>
  } | null
}

export default function IngestionDrawer({ id, open, onClose }: { id: number | string | null; open: boolean; onClose: () => void }) {
  const [data, setData] = useState<Detail | null>(null)
  const [loading, setLoading] = useState(false)
  const [showPreview, setShowPreview] = useState(false)
  const [rejectOpen, setRejectOpen] = useState(false)
  const { enqueueSnackbar } = useSnackbar()

  const reload = async (ingId: number | string) => {
    const r = await fetch(`/api/ingestions/${ingId}`)
    setData((await r.json()) as Detail)
  }

  useEffect(() => {
    const load = async () => {
      if (!open || id == null) return
      setLoading(true)
      try {
        await reload(id)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [open, id])

  const canApprove = !!(data?.ingestion && data.ingestion.approval_mode === 'manual' && data.ingestion.approval_status === 'ready')
  const canMarkReady = !!(data?.ingestion && data.ingestion.approval_status === 'pending' && (data?.counts?.unmatched === 0) && !!data?.draft)

  const handleApprove = useCallback(async () => {
    if (!data?.ingestion) return
    try {
      await apiFetch(`/approvals/${data.ingestion.ingestion_id}/approve`, { method: 'POST' })
      enqueueSnackbar('Approved', { variant: 'success' })
      try { window.dispatchEvent(new Event('review:refresh')) } catch {}
      await reload(data.ingestion.ingestion_id)
    } catch (e: unknown) {
      enqueueSnackbar(e instanceof Error ? e.message : 'Approve failed', { variant: 'error' })
    }
  }, [data?.ingestion, enqueueSnackbar])

  // Keyboard shortcuts when drawer is open
  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase()
      if (key === 'a' && canApprove) {
        e.preventDefault()
        void handleApprove()
      } else if (key === 'r' && canApprove) {
        e.preventDefault()
        setRejectOpen(true)
      } else if (key === 'v' && data?.storage_key) {
        e.preventDefault()
        setShowPreview((v) => !v)
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [open, canApprove, data?.storage_key, handleApprove])

  const contentRef = useRef<HTMLDivElement | null>(null)

  return (
    <>
      <Drawer
        anchor="right"
        open={open}
        onClose={onClose}
        variant="persistent"
        PaperProps={{ sx: { width: { xs: '100%', md: 560 }, mt: { xs: '56px', sm: '64px' }, height: { xs: 'calc(100% - 56px)', sm: 'calc(100% - 64px)' } } }}
      >
        <Box sx={{ p: 2 }} ref={contentRef}>
          <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1 }}>
            <Box />
            <IconButton onClick={onClose}>
              <CloseIcon />
            </IconButton>
          </Stack>
          {data?.ingestion ? (
            <ReviewHeader
              vendor={data?.invoice?.vendor_name || data?.draft?.vendor_name || '—'}
              billNo={data?.invoice?.bill_number || data?.draft?.bill_number || '—'}
              billDate={data?.invoice?.bill_date || data?.draft?.date || '—'}
              status={(data.ingestion.approval_status === 'ready' && data.draft ? 'ready' : (data.ingestion.status || 'queued')) as 'billed' | 'failed' | 'ready' | 'posting' | 'matched' | 'queued' | 'extracting'}
              mode={(data.ingestion.approval_mode || 'manual') as 'manual' | 'auto'}
              canAct={canApprove}
              onApprove={handleApprove}
              onReject={() => setRejectOpen(true)}
              onView={() => setShowPreview((v) => !v)}
              onMarkReady={canMarkReady ? async () => {
                if (!data?.ingestion) return
                try {
                  await fetch(`/api/ingestions/${data.ingestion.ingestion_id}/ready`, { method: 'POST' })
                  enqueueSnackbar('Marked as ready', { variant: 'success' })
                  await reload(data.ingestion.ingestion_id)
                  try { window.dispatchEvent(new Event('review:refresh')) } catch {}
                } catch (e: unknown) {
                  enqueueSnackbar(e instanceof Error ? e.message : 'Mark ready failed', { variant: 'error' })
                }
              } : null}
            />
          ) : null}

          {loading ? (
            <Stack spacing={2} sx={{ py: 2 }}>
              <Skeleton variant="rounded" height={120} />
              <Skeleton variant="rounded" height={36} />
              <Skeleton variant="rounded" height={200} />
            </Stack>
          ) : data ? (
            <Stack spacing={2} sx={{ mt: 2 }}>
              {data.invoice ? (
                <Paper variant="outlined" sx={{ p: 1.5 }}>
                  <Stack spacing={1}>
                    <Typography variant="subtitle2">Invoice summary</Typography>
                    <Typography variant="body2" color="text.secondary">
                      Vendor: {data.invoice.vendor_name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Bill: {data.invoice.bill_number} • {new Date(data.invoice.bill_date).toLocaleDateString()}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Total: {data.invoice.currency} {data.invoice.grand_total?.toLocaleString()}
                    </Typography>
                  </Stack>
                </Paper>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  No invoice data yet.
                </Typography>
              )}
              <Stack direction="row" spacing={1}>
                {data.counts.to_create > 0 && <Chip color="warning" label={`New items: ${data.counts.to_create}`} />}
                {data.counts.unmatched > 0 && <Chip color="info" label={`Unmatched: ${data.counts.unmatched}`} />}
              </Stack>
              
              {data.draft ? (
                <>
                  <Divider />
                  <Typography variant="subtitle2">Draft</Typography>
                  <Paper variant="outlined" sx={{ p: 1.5 }}>
                    <Stack spacing={1.2}>
                      <Typography variant="body2" color="text.secondary">
                        Vendor: {data.draft.vendor_name || data.draft.vendor_id || '—'}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Bill: {data.draft.bill_number || '—'} • {data.draft.date ? new Date(data.draft.date).toLocaleDateString() : '—'}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Due: {data.draft.due_date ? new Date(data.draft.due_date).toLocaleDateString() : '—'}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Discount type: {data.draft.discount_type || '—'} • Item-level tax: {data.draft.is_item_level_tax_calc ? 'Yes' : 'No'}
                      </Typography>
                      <Divider />
                      <Typography variant="body2">Resolve line items</Typography>
                      <LineResolver
                        ingestionId={data.ingestion.ingestion_id}
                        invoiceId={data.invoice?.invoice_id ?? null}
                        canEdit={String(data.ingestion.status || '').toLowerCase() !== 'billed'}
                        containerEl={contentRef}
                        dbLines={(data.lines || []).map((l) => ({
                          line_id: l.line_id,
                          line_no: l.line_no,
                          match_state: l.match_state,
                          item_id: l.item_id ?? null,
                          item_name: l.item_name ?? null,
                          description: l.description ?? null,
                          quantity: l.quantity ?? null,
                          rate: l.rate ?? null,
                        }))}
                        draftLines={(data.draft.line_items || []).map((li) => ({
                          item_id: (li as any).item_id ?? null,
                          description: li.item_name || li.description || null,
                          quantity: li.quantity ?? null,
                          rate: li.rate ?? null,
                          discount: li.discount ?? null,
                          hsn_or_sac: li.hsn_or_sac ?? null,
                        }))}
                        onChanged={async () => {
                          if (data?.ingestion?.ingestion_id) await reload(data.ingestion.ingestion_id)
                        }}
                      />
                    </Stack>
                  </Paper>
                </>
              ) : null}

              {data?.ingestion?.status === 'failed' && data?.ingestion?.error ? (
                <Paper variant="outlined" sx={{ p: 1.5 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    Error
                  </Typography>
                  <Typography variant="caption" sx={{ opacity: 0.8 }}>
                    {(() => {
                      const err = data?.ingestion?.error as unknown
                      if (typeof err === 'string') return err.length > 280 ? err.slice(0, 280) + '…' : err
                      try {
                        const s = JSON.stringify(err)
                        return s.length > 280 ? s.slice(0, 280) + '…' : s
                      } catch { return '—' }
                    })()}
                  </Typography>
                  {(() => {
                    const err = data?.ingestion?.error as unknown
                    if (err && typeof err === 'object') {
                      const rec = err as Record<string, unknown>
                      const url = (rec['execution_url'] || rec['executionUrl']) as string | undefined
                      return url ? (
                        <Typography variant="body2" sx={{ mt: 1 }}>
                          <MuiLink href={url} target="_blank" rel="noreferrer">
                            View logs
                          </MuiLink>
                        </Typography>
                      ) : null
                    }
                    return null
                  })()}
                </Paper>
              ) : null}
            </Stack>
          ) : null}
        </Box>
      </Drawer>
      <BillViewerDrawer storageKey={data?.storage_key ?? null} open={showPreview} onClose={() => setShowPreview(false)} />
      <RejectDialog
        open={rejectOpen}
        onClose={() => setRejectOpen(false)}
        onConfirm={async (reason) => {
          setRejectOpen(false)
          if (!data?.ingestion) return
          try {
            await apiFetch(`/approvals/${data.ingestion.ingestion_id}/reject`, { method: 'POST', body: { reason } })
            enqueueSnackbar(`Rejected${reason ? ` (${reason})` : ''}`, { variant: 'success' })
            await reload(data.ingestion.ingestion_id)
            try { window.dispatchEvent(new Event('review:refresh')) } catch {}
          } catch (e: unknown) {
            enqueueSnackbar(e instanceof Error ? e.message : 'Reject failed', { variant: 'error' })
          }
        }}
      />
    </>
  )
}
