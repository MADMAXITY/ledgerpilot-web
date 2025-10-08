"use client"
import { useEffect, useMemo, useState } from 'react'
import { Box, Drawer, IconButton, Stack, Toolbar, Typography, Tooltip, ButtonGroup, Button } from '@mui/material'
import CloseIcon from '@mui/icons-material/Close'
import { createSupabaseBrowserClient } from '@/lib/supabase'

export default function BillViewerDrawer({
  storageKey,
  open,
  onClose,
}: {
  storageKey: string | null
  open: boolean
  onClose: () => void
}) {
  const supabase = useMemo(() => createSupabaseBrowserClient(), [])
  const [signedUrl, setSignedUrl] = useState<string | null>(null)
  const [isPdf, setIsPdf] = useState(false)
  // Treat current visual 50% as 100% baseline
  const BASE = 0.5
  const [scale, setScale] = useState(BASE)

  useEffect(() => {
    const load = async () => {
      if (!open || !storageKey) return
      const objectPath = storageKey.replace(/^invoices-original\//, '')
      const { data, error } = await supabase.storage
        .from('invoices-original')
        .createSignedUrl(objectPath, 300)
      if (!error) {
        const url = data.signedUrl
        const ext = (objectPath.split('.').pop() || '').toLowerCase()
        const pdf = ext === 'pdf'
        setIsPdf(pdf)
        if (pdf) {
          const encoded = encodeURIComponent(url)
          // Use pdf.js viewer to ensure fit-to-page and toolbar with zoom
          setSignedUrl(`https://mozilla.github.io/pdf.js/web/viewer.html?file=${encoded}#zoom=page-fit`)
        } else {
          setSignedUrl(url)
        }
      }
    }
    load()
  }, [open, storageKey, supabase])

  useEffect(() => {
    // Reset scale to baseline whenever drawer toggles
    setScale(BASE)
  }, [open])

  return (
    <Drawer
      anchor="left"
      open={open}
      onClose={onClose}
      variant="persistent"
      PaperProps={{ sx: { width: { xs: '100%', md: '60%' }, mt: { xs: '56px', sm: '64px' }, height: { xs: 'calc(100% - 56px)', sm: 'calc(100% - 64px)' } } }}
    >
      <Toolbar sx={{ px: 2, justifyContent: 'space-between', gap: 1 }}>
        <Typography variant="subtitle1">Uploaded Bill</Typography>
        {!isPdf && (
          <ButtonGroup size="small" variant="outlined">
            <Tooltip title="Zoom out">
              <Button onClick={() => setScale((s) => Math.max(0.25, s - 0.25))} disabled={scale <= 0.25}>-</Button>
            </Tooltip>
            <Tooltip title="Reset zoom">
              <Button onClick={() => setScale(BASE)}>{`${Math.round((scale / BASE) * 100)}%`}</Button>
            </Tooltip>
            <Tooltip title="Zoom in">
              <Button onClick={() => setScale((s) => Math.min(5, s + 0.25))} disabled={scale >= 5}>+</Button>
            </Tooltip>
          </ButtonGroup>
        )}
        <IconButton onClick={onClose} aria-label="Close bill viewer">
          <CloseIcon />
        </IconButton>
      </Toolbar>
      <Stack sx={{ flex: 1, minHeight: 0 }}>
        {signedUrl ? (
          isPdf ? (
            <Box component="iframe" src={signedUrl} sx={{ width: '100%', height: '100%', border: 0 }} />
          ) : (
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%', overflow: 'auto', bgcolor: 'background.default' }}>
              <Box sx={{ transform: `scale(${scale})`, transformOrigin: 'center', transition: 'transform 120ms ease' }}>
                <img src={signedUrl} alt="Uploaded bill" style={{ maxWidth: '100%', maxHeight: '100%', display: 'block' }} />
              </Box>
            </Box>
          )
        ) : (
          <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'text.secondary' }}>
            {storageKey ? 'Preparing preview…' : 'No file available'}
          </Box>
        )}
      </Stack>
    </Drawer>
  )
}
