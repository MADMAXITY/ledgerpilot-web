"use client"
import { useRef, useState } from 'react'
import { Alert, Box, Button, LinearProgress, Paper, Stack, Typography, Dialog, DialogTitle, DialogContent, DialogActions } from '@mui/material'
import CloudUploadIcon from '@mui/icons-material/CloudUpload'
import { useSnackbar } from 'notistack'
import { createSupabaseBrowserClient } from '@/lib/supabase'
import { useOrg } from '@/lib/org'
import { apiFetch } from '@/lib/api'
import type { StartIngestionResponse } from '@/types/contracts'

export default function UploadDropzone({ onCompleted }: { onCompleted?: () => void }) {
  const { orgId } = useOrg()
  const { enqueueSnackbar } = useSnackbar()
  const supabase = createSupabaseBrowserClient()
  const [uploading, setUploading] = useState(false)
  const [inputKey, setInputKey] = useState(() => `${Date.now()}`)
  const [resultMsg, setResultMsg] = useState<{ ok: boolean; text: string; details?: string } | null>(null)
  const inputRef = useRef<HTMLInputElement | null>(null)
    // Approval mode is always manual (auto removed)
  const [showErrorDetails, setShowErrorDetails] = useState(false)

  const handleFiles = async (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return
    if (uploading) return
    if (!orgId) {
      enqueueSnackbar('Org not ready yet. Please try again.', { variant: 'warning' })
      return
    }

    const file = fileList[0]
    try {
      setUploading(true)
      const objectName = `${orgId}/${crypto.randomUUID()}-${file.name}`
      const { error: upErr } = await supabase.storage
        .from('invoices-original')
        .upload(objectName, file, { upsert: false, contentType: file.type })
      if (upErr) throw upErr

      const storageKey = `invoices-original/${objectName}`

      const { data: fileRow, error: fileInsErr } = await supabase
        .from('files')
        .insert({
          org_id: orgId,
          source: 'web',
          source_ref: null,
          storage_key: storageKey,
          mime_type: file.type || null,
          size_bytes: file.size,
        })
        .select()
        .single()
      if (fileInsErr) throw fileInsErr

      const { data: ingestion, error: ingErr } = await supabase
        .from('ingestions')
        .insert({
          org_id: orgId,
          file_id: fileRow.file_id,
          status: 'queued',
          // approval_mode defaults to 'manual' on the server,
        })
        .select()
        .single()
      if (ingErr) throw ingErr

      await apiFetch<StartIngestionResponse>(`/ingestions/${ingestion.ingestion_id}/start`, { method: 'POST' })
      enqueueSnackbar('Upload queued and started', { variant: 'success' })
      setResultMsg({ ok: true, text: 'Invoice received and processing has started.' })
      onCompleted?.()
    } catch (err: unknown) {
      console.error(err)
      const details = err instanceof Error ? err.message : typeof err === 'string' ? err : JSON.stringify(err)
      enqueueSnackbar('Upload failed', { variant: 'error' })
      setResultMsg({ ok: false, text: 'Upload failed. See details for more information.', details })
    } finally {
      setUploading(false)
      // reset file input so selecting the same file again fires onChange
      if (inputRef.current) inputRef.current.value = ''
      setInputKey(`${Date.now()}`)
    }
  }

  return (
    <Paper
      variant="outlined"
      sx={{ p: 3, borderStyle: 'dashed', borderColor: 'divider', maxWidth: 720, mx: 'auto' }}
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => {
        e.preventDefault()
        handleFiles(e.dataTransfer.files)
      }}
    >
      <Stack spacing={2} alignItems="center">
        {/* Approval mode is always manual; toggle removed */}
        <CloudUploadIcon sx={{ fontSize: 36, color: 'primary.main' }} />
        <Typography variant="h6">Upload invoice</Typography>
        <Typography variant="body2" color="text.secondary">
          Drag and drop a file here, or click to browse
        </Typography>
        <Box>
          <Button component="label" variant="contained" disabled={uploading}>
            Choose file
            <input
              key={inputKey}
              ref={inputRef}
              hidden
              type="file"
              onClick={(e) => ((e.currentTarget as HTMLInputElement).value = '')}
              onChange={(e) => handleFiles(e.target.files)}
            />
          </Button>
        </Box>
        {uploading && (
          <Box sx={{ width: '100%' }}>
            <LinearProgress />
          </Box>
        )}
        {resultMsg && (
          <Alert
            severity={resultMsg.ok ? 'success' : 'error'}
            onClose={() => setResultMsg(null)}
            sx={{ width: '100%' }}
            action={
              !resultMsg.ok && resultMsg.details ? (
                <Button color="inherit" size="small" onClick={() => setShowErrorDetails(true)}>
                  View details
                </Button>
              ) : undefined
            }
          >
            {resultMsg.text}
          </Alert>
        )}
        <Dialog open={showErrorDetails} onClose={() => setShowErrorDetails(false)} maxWidth="md" fullWidth>
          <DialogTitle>Error details</DialogTitle>
          <DialogContent dividers>
            <Box component="pre" sx={{ m: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
              {(resultMsg?.details || '').slice(0, 4000)}
            </Box>
          </DialogContent>
          <DialogActions>
            <Button
              onClick={() => {
                if (resultMsg?.details) navigator.clipboard.writeText(resultMsg.details)
              }}
            >
              Copy
            </Button>
            <Button variant="contained" onClick={() => setShowErrorDetails(false)}>
              Close
            </Button>
          </DialogActions>
        </Dialog>
      </Stack>
    </Paper>
  )
}
