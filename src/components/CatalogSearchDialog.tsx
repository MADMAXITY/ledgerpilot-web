"use client"
import { useEffect, useMemo, useState } from 'react'
import { Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, List, ListItemButton, ListItemText, Stack, TextField, Typography } from '@mui/material'

export default function CatalogSearchDialog({
  open,
  ingestionId,
  onClose,
  onSelect,
}: {
  open: boolean
  ingestionId: number | string
  onClose: () => void
  onSelect: (item: { item_id: string; name: string | null; hsn8: string | null }) => void
}) {
  const [q, setQ] = useState('')
  const [loading, setLoading] = useState(false)
  const [items, setItems] = useState<Array<{ item_id: string; name: string | null; hsn8: string | null }>>([])

  const fetchItems = useMemo(
    () =>
      async (query: string) => {
        setLoading(true)
        try {
          const u = new URL(`/api/ingestions/${ingestionId}/items`, window.location.origin)
          if (query) u.searchParams.set('q', query)
          u.searchParams.set('limit', '20')
          const res = await fetch(u.toString(), { cache: 'no-store' })
          const json = (await res.json()) as { ok: boolean; items: Array<{ item_id: string; name: string | null; hsn8: string | null }> }
          if (json.ok) setItems(json.items || [])
        } catch {
          // ignore
        } finally {
          setLoading(false)
        }
      },
    [ingestionId]
  )

  useEffect(() => {
    if (!open) return
    void fetchItems(q)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  useEffect(() => {
    if (!open) return
    const handle = setTimeout(() => void fetchItems(q), 250)
    return () => clearTimeout(handle)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, open])

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>Browse catalog</DialogTitle>
      <DialogContent>
        <Stack spacing={1.5}>
          <TextField
            size="small"
            placeholder="Search items by name"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') void fetchItems(q)
            }}
          />
          {loading ? (
            <Typography variant="body2" color="text.secondary">
              Loading...
            </Typography>
          ) : (
            <List dense sx={{ maxHeight: 320, overflow: 'auto' }}>
              {items.map((it) => (
                <ListItemButton key={it.item_id} onClick={() => onSelect(it)}>
                  <ListItemText primary={it.name || it.item_id} secondary={it.hsn8 ? `HSN/SAC: ${it.hsn8}` : undefined} />
                </ListItemButton>
              ))}
              {!items.length ? (
                <Box sx={{ py: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    No items found.
                  </Typography>
                </Box>
              ) : null}
            </List>
          )}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
        <Button variant="contained" onClick={() => void fetchItems(q)}>
          Search
        </Button>
      </DialogActions>
    </Dialog>
  )
}
