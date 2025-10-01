"use client"
import { useEffect, useMemo, useState } from 'react'
import { Alert, Box, Button, Paper, Stack, Typography } from '@mui/material'
import { useSnackbar } from 'notistack'
import { createSupabaseBrowserClient } from '@/lib/supabase'
import { apiFetch } from '@/lib/api'

export default function BillPreview({
  ingestionId,
  storageKey,
  billPayloadDraft,
  error,
}: {
  ingestionId: string | number
  storageKey?: string | null
  billPayloadDraft?: unknown
  error?: unknown
}) {
  const { enqueueSnackbar } = useSnackbar()
  const supabase = useMemo(() => createSupabaseBrowserClient(), [])
  const [signedUrl, setSignedUrl] = useState<string | null>(null)

  useEffect(() => {
    const load = async () => {
      if (!storageKey) return
      const withoutBucket = storageKey.replace(/^invoices-original\//, '')
      const { data, error } = await supabase.storage.from('invoices-original').createSignedUrl(withoutBucket, 60)
      if (error) {
        console.error(error)
        return
      }
      setSignedUrl(data.signedUrl)
    }
    load()
  }, [storageKey, supabase])

  const onApprove = async () => {
    try {
      await apiFetch(`/approvals/${ingestionId}/approve`, { method: 'POST' })
      enqueueSnackbar('Approved', { variant: 'success' })
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Approve failed'
      enqueueSnackbar(msg, { variant: 'error' })
    }
  }

  const onReject = async () => {
    const reason = window.prompt('Reason for rejection?') || ''
    try {
      await apiFetch(`/approvals/${ingestionId}/reject`, { method: 'POST', body: { reason } })
      enqueueSnackbar('Rejected', { variant: 'success' })
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Reject failed'
      enqueueSnackbar(msg, { variant: 'error' })
    }
  }

  return (
    <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
      <Paper sx={{ p: 2, flex: 1, minHeight: 420 }}>
        <Typography variant="subtitle1" sx={{ mb: 1 }}>
          Original file
        </Typography>
        {storageKey ? (
          signedUrl ? (
            <Box component="iframe" src={signedUrl} sx={{ width: '100%', height: 520, border: 0 }} />
          ) : (
            <Typography variant="body2" color="text.secondary">
              Generating preview...
            </Typography>
          )
        ) : (
          <Alert severity="info">Preview unavailable: storage_key not provided by API</Alert>
        )}
      </Paper>

      <Paper sx={{ p: 2, flex: 1 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
          <Typography variant="subtitle1">Bill draft</Typography>
          <Stack direction="row" spacing={1}>
            <Button variant="outlined" color="error" onClick={onReject}>
              Reject
            </Button>
            <Button variant="contained" onClick={onApprove}>
              Approve
            </Button>
          </Stack>
        </Stack>
        <Box component="pre" sx={{ m: 0, p: 2, bgcolor: 'background.default', borderRadius: 1, overflow: 'auto', maxHeight: 540 }}>
          {JSON.stringify(billPayloadDraft ?? {}, null, 2)}
        </Box>
        {error ? (
          <Alert sx={{ mt: 2 }} severity="error">
            {typeof error === 'string' ? error : JSON.stringify(error)}
          </Alert>
        ) : null}
      </Paper>
    </Stack>
  )
}
