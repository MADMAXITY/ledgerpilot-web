"use client"

import { useEffect, useState } from 'react'
import { Box, Chip, CircularProgress, Divider, Drawer, IconButton, List, ListItem, ListItemText, Stack, Typography, Paper, Button } from '@mui/material'
import BillViewerDrawer from './BillViewerDrawer'
import CloseIcon from '@mui/icons-material/Close'
import { useSnackbar } from 'notistack'
import { apiFetch } from '@/lib/api'

type Detail = {
  ok: boolean
  ingestion: { ingestion_id: number; created_at: string; status?: string; approval_mode?: string; approval_status?: string }
  storage_key: string | null
  invoice: { invoice_id: number; vendor_name: string; bill_number: string; bill_date: string; grand_total: number; currency: string } | null
  lines: Array<{ line_id: number; line_no: number; description: string | null; amount: number | null; item_name: string | null; match_state: string }>
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

  const canApprove = !!(
    data?.ingestion && data.ingestion.approval_mode === 'manual' && data.ingestion.approval_status === 'ready'
  )

  return (
    <>
      <Drawer
        anchor="right"
        open={open}
        onClose={onClose}
        PaperProps={{ sx: { width: { xs: '100%', md: 560 }, mt: { xs: '56px', sm: '64px' }, height: { xs: 'calc(100% - 56px)', sm: 'calc(100% - 64px)' } } }}
      >
        <Box sx={{ p: 2 }}>
          <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1 }}>
            <Stack direction="row" spacing={0.75} alignItems="center">
              {data?.ingestion ? (
                <Stack direction="row" spacing={1}>
                  <Chip size="small" label={`status: ${data.ingestion.status ?? ''}`} />
                  <Chip size="small" color="info" label={`mode: ${data.ingestion.approval_mode ?? ''}`} />
                  <Chip size="small" color="warning" label={`approval: ${data.ingestion.approval_status ?? ''}`} />
                </Stack>
              ) : null}
            </Stack>
            <IconButton onClick={onClose}>
              <CloseIcon />
            </IconButton>
          </Stack>
          <Stack direction="row" spacing={1} sx={{ mb: 1 }}>
            {data?.storage_key ? (
              <Chip label={showPreview ? 'Hide uploaded bill' : 'View uploaded bill'} color={showPreview ? 'secondary' : 'default'} onClick={() => setShowPreview((v) => !v)} />
            ) : null}
            {canApprove && data?.ingestion ? (
              <Stack direction="row" spacing={1}>
                <Button size="small" variant="contained" onClick={async () => {
                  try {
                    await apiFetch(`/approvals/${data.ingestion.ingestion_id}/approve`, { method: 'POST' })
                    enqueueSnackbar('Approved', { variant: 'success' })
                    await reload(data.ingestion.ingestion_id)
                  } catch (e: unknown) {
                    enqueueSnackbar(e instanceof Error ? e.message : 'Approve failed', { variant: 'error' })
                  }
                }}>Approve</Button>
                <Button size="small" color="error" variant="outlined" onClick={async () => {
                  const reason = window.prompt('Reason for rejection?') || ''
                  try {
                    await apiFetch(`/approvals/${data.ingestion.ingestion_id}/reject`, { method: 'POST', body: { reason } })
                    enqueueSnackbar('Rejected', { variant: 'success' })
                    await reload(data.ingestion.ingestion_id)
                  } catch (e: unknown) {
                    enqueueSnackbar(e instanceof Error ? e.message : 'Reject failed', { variant: 'error' })
                  }
                }}>Reject</Button>
              </Stack>
            ) : null}
          </Stack>
          {loading ? (
            <Stack alignItems="center" sx={{ py: 8 }}>
              <CircularProgress />
            </Stack>
          ) : data ? (
            <Stack spacing={2}>
              {data.invoice ? (
                <Box>
                  <Typography variant="subtitle1" sx={{ mb: 0.5 }}>
                    {data.invoice.vendor_name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {data.invoice.bill_number} · {new Date(data.invoice.bill_date).toLocaleDateString()}
                  </Typography>
                  <Typography variant="h6" sx={{ mt: 1 }}>
                    {data.invoice.grand_total} {data.invoice.currency || ''}
                  </Typography>
                </Box>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  No invoice data yet.
                </Typography>
              )}
              <Stack direction="row" spacing={1}>
                {data.counts.to_create > 0 && <Chip color="warning" label={`New items: ${data.counts.to_create}`} />}
                {data.counts.unmatched > 0 && <Chip color="info" label={`Unmatched: ${data.counts.unmatched}`} />}
              </Stack>
              <Divider />
              <Typography variant="subtitle2">Lines</Typography>
              <List dense>
                {(data.lines || []).map((l, idx) => (
                  <ListItem key={l.line_id} disableGutters>
                    <ListItemText
                      primary={
                        <Stack direction="row" spacing={0.5} alignItems="center">
                          <Typography variant="body2" sx={{ minWidth: 18 }}>{idx + 1}.</Typography>
                          <Typography variant="body2">{l.item_name || l.description || '—'}</Typography>
                          <Chip size="small" label={l.match_state} color={l.match_state === 'to_create' ? 'warning' : l.match_state === 'unmatched' ? 'default' : 'success'} />
                        </Stack>
                      }
                      secondary={l.amount != null ? `Amount: ${l.amount}` : undefined}
                    />
                  </ListItem>
                ))}
              </List>
              {data.draft ? (
                <>
                  <Divider />
                  <Typography variant="subtitle2">Draft</Typography>
                  <Paper variant="outlined" sx={{ p: 1.5 }}>
                    <Stack spacing={1}>
                      <Typography variant="body2" color="text.secondary">
                        Vendor: {data.draft.vendor_name || data.draft.vendor_id || '—'}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Bill: {data.draft.bill_number || '—'} · {data.draft.date ? new Date(data.draft.date).toLocaleDateString() : '—'}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Due: {data.draft.due_date ? new Date(data.draft.due_date).toLocaleDateString() : '—'}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Discount type: {data.draft.discount_type || '—'} · Item-level tax: {data.draft.is_item_level_tax_calc ? 'Yes' : 'No'}
                      </Typography>
                      <Divider />
                      <Typography variant="body2">Draft line items</Typography>
                      <List dense>
                        {(data.draft.line_items || []).map((li, idx) => (
                          <ListItem key={`${li.item_id || 'x'}-${idx}`} disableGutters>
                            <ListItemText
                              primary={
                                <Stack direction="row" spacing={0.5} alignItems="center">
                                  <Typography variant="body2" sx={{ minWidth: 18 }}>{idx + 1}.</Typography>
                                  <Typography variant="body2">{li.item_name || li.description || '—'}</Typography>
                                </Stack>
                              }
                              secondary={
                                <>
                                  <Typography variant="caption" color="text.secondary">
                                    Qty: {li.quantity ?? 1} · Rate: {li.rate ?? '—'}{li.discount != null ? ` · Discount: ${li.discount}` : ''}
                                  </Typography>
                                  {li.hsn_or_sac ? (
                                    <Typography variant="caption" color="text.secondary"> · HSN/SAC: {li.hsn_or_sac}</Typography>
                                  ) : null}
                                </>
                              }
                            />
                          </ListItem>
                        ))}
                      </List>
                    </Stack>
                  </Paper>
                </>
              ) : null}
            </Stack>
          ) : null}
        </Box>
      </Drawer>
      <BillViewerDrawer storageKey={data?.storage_key ?? null} open={showPreview} onClose={() => setShowPreview(false)} />
    </>
  )
}

