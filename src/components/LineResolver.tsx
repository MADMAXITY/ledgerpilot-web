"use client"
import { useMemo, useState } from 'react'
import { Box, Button, Card, CardContent, Chip, Menu, MenuItem, Stack, Typography, CircularProgress } from '@mui/material'
import StatusChip from './StatusChip'
import CatalogSearchDialog from './CatalogSearchDialog'

type DbLine = {
  line_id: number
  line_no: number
  match_state: string
  item_id?: string | null
  item_name?: string | null
  description?: string | null
  quantity?: number | null
  rate?: number | null
}

type DraftLine = { item_id?: string | null; description?: string | null; quantity?: number | null; rate?: number | null; discount?: number | null; hsn_or_sac?: string | null }

export default function LineResolver({
  ingestionId,
  invoiceId,
  dbLines,
  draftLines,
  onChanged,
  canEdit = true,
  containerEl,
}: {
  ingestionId: number | string
  invoiceId: number | string | null
  dbLines: DbLine[]
  draftLines: DraftLine[]
  onChanged: () => void
  canEdit?: boolean
  containerEl?: React.RefObject<HTMLElement | null>
}) {
  const [activeLineId, setActiveLineId] = useState<number | null>(null)
  const [suggestions, setSuggestions] = useState<Array<{ item_id: string; name: string | null; hsn8: string | null; similarity?: number }>>([])
  const [loading, setLoading] = useState(false)
  const [catalogOpen, setCatalogOpen] = useState(false)
  const [anchorPos, setAnchorPos] = useState<{ top: number; left: number } | null>(null)

  const activeLine = useMemo(() => dbLines.find((l) => l.line_id === activeLineId) || null, [dbLines, activeLineId])

  const openSuggestMenu = async (el: HTMLElement, lineId: number) => {
    setActiveLineId(lineId)
    setLoading(true)
    try {
      const drawerLeft = containerEl?.current ? (containerEl.current as HTMLElement).getBoundingClientRect().left : 0
      const btnRect = el.getBoundingClientRect()
      const width = 420
      const gap = 8
      const left = Math.max(0, Math.round(drawerLeft - width - gap))
      setAnchorPos({ top: Math.round(btnRect.top), left })
    } catch {
      setAnchorPos(null)
    }
    try {
      const res = await fetch(`/api/lines/${lineId}/candidates?top=5`, { cache: 'no-store' })
      const json = (await res.json()) as { ok: boolean; items: Array<{ candidate_item_id: string; candidate_name: string | null; hsn8: string | null; similarity?: number }> }
      if (json.ok) {
        setSuggestions((json.items || []).map((c) => ({ item_id: c.candidate_item_id, name: c.candidate_name, hsn8: c.hsn8 || null, similarity: c.similarity })))
      } else setSuggestions([])
    } catch {
      setSuggestions([])
    } finally {
      setLoading(false)
    }
  }

  const closeSuggestMenu = () => {
    setAnchorPos(null)
    setActiveLineId(null)
    setSuggestions([])
    setLoading(false)
  }

  const assign = async (lineId: number, itemId: string) => {
    await fetch(`/api/ingestions/${ingestionId}/lines/${lineId}/assign`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ item_id: itemId }),
    })
    closeSuggestMenu()
    onChanged()
  }

  const needsCreate = async (lineId: number) => {
    await fetch(`/api/ingestions/${ingestionId}/lines/${lineId}/needs-create`, { method: 'POST' })
    onChanged()
  }

  const onSelectFromCatalog = async (it: { item_id: string; name: string | null; hsn8: string | null }) => {
    if (!activeLine) return
    await assign(activeLine.line_id, it.item_id)
    setCatalogOpen(false)
  }

  const byIdx = (i: number): DbLine | null => (dbLines[i] ? dbLines[i] : null)

  return (
    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr' }, gap: 1.5 }}>
      {draftLines.map((dl, i) => {
        const db = byIdx(i)
        const name = (dl.description || db?.item_name || '—') as string
        const qty = dl.quantity ?? null
        const rate = dl.rate ?? null
        const ms = db?.match_state || 'unmatched'

        return (
          <Card key={i} variant="outlined">
            <CardContent>
              <Stack direction="row" justifyContent="space-between" alignItems="baseline">
                <Typography fontWeight={600} sx={{ pr: 1, maxWidth: '70%' }}>{name}</Typography>
                <Typography variant="body2" sx={{ opacity: 0.8 }}>
                  {qty != null ? `Qty: ${qty}` : ''} {rate != null ? `• Rate: ${rate}` : ''}
                </Typography>
              </Stack>
              <Stack direction={{ xs: 'row' }} spacing={1} sx={{ mt: 1 }} alignItems="center">
                <StatusChip type={(ms as any) || 'unmatched'} size="small" />
              </Stack>
              {canEdit ? (
                <Stack direction={{ xs: 'row' }} spacing={1} sx={{ mt: 1 }} alignItems="center">
                  <Button
                    size="small"
                    variant="outlined"
                    sx={{ borderColor: 'rgba(99,102,241,.28)', background: 'rgba(99,102,241,.10)', color: 'primary.light', textTransform: 'none', '&:hover': { background: 'rgba(99,102,241,.16)', borderColor: 'rgba(99,102,241,.42)' } }}
                    onClick={(e) => db && openSuggestMenu(e.currentTarget, db.line_id)}
                    disabled={!db}
                  >
                    {ms === 'human_matched' ? 'Change selection' : 'Select match'}
                  </Button>
                  <Button
                    size="small"
                    color="warning"
                    variant="outlined"
                    sx={{ borderColor: 'rgba(245,158,11,.34)', background: 'rgba(245,158,11,.10)', color: '#FBBF24', textTransform: 'none', '&:hover': { background: 'rgba(245,158,11,.16)', borderColor: 'rgba(245,158,11,.46)' } }}
                    onClick={() => db && needsCreate(db.line_id)}
                    disabled={!db}
                  >
                    Needs create
                  </Button>
                </Stack>
              ) : null}
            </CardContent>
          </Card>
        )
      })}

      <Menu
        open={!!anchorPos}
        onClose={closeSuggestMenu}
        anchorReference="anchorPosition"
        anchorPosition={anchorPos || { top: 0, left: 0 }}
        PaperProps={{ sx: { width: 420, maxWidth: '44vw', maxHeight: 420, overflowY: 'auto', overflowX: 'hidden', border: '1px solid rgba(148,163,184,0.22)', p: 0 } }}
      >
        {loading ? (
          <MenuItem disabled>
            <Stack direction="row" spacing={1} alignItems="center">
              <CircularProgress size={16} />
              <Typography variant="body2">Loading…</Typography>
            </Stack>
          </MenuItem>
        ) : (
          <>
            {suggestions.map((s, i) => (
              <MenuItem
                key={s.item_id}
                onClick={() => activeLine && assign(activeLine.line_id, s.item_id)}
                sx={{ alignItems: 'flex-start', py: 1, px: 1.25, ...(i > 0 ? { borderTop: '1px solid rgba(148,163,184,0.14)' } : {}) }}
              >
                <Stack spacing={0.5} sx={{ width: '100%' }}>
                  <Typography variant="body2" sx={{ whiteSpace: 'normal', wordBreak: 'break-word', fontWeight: 600 }}>
                    {s.name || s.item_id}
                  </Typography>
                  <Stack direction="row" spacing={0.25} flexWrap="wrap" alignItems="center">
                    {s.hsn8 ? (
                      <Chip
                        size="small"
                        label={`HSN ${s.hsn8}`}
                        sx={{ height: 16, '& .MuiChip-label': { px: 0.5, fontSize: 10, lineHeight: '16px' } }}
                      />
                    ) : null}
                    {typeof s.similarity === 'number' ? (
                      <Chip
                        size="small"
                        variant="outlined"
                        label={`similarity ${(s.similarity * 100).toFixed(0)}%`}
                        sx={{ height: 16, '& .MuiChip-label': { px: 0.5, fontSize: 10, lineHeight: '16px' } }}
                      />
                    ) : null}
                  </Stack>
                </Stack>
              </MenuItem>
            ))}
            {!suggestions.length ? <MenuItem disabled>No suggestions</MenuItem> : null}
          </>
        )}
        <MenuItem onClick={() => setCatalogOpen(true)} sx={{ borderTop: '1px solid rgba(148,163,184,0.14)', py: 1, px: 1.25 }}>Browse catalog…</MenuItem>
      </Menu>

      <CatalogSearchDialog open={catalogOpen} ingestionId={ingestionId} onClose={() => setCatalogOpen(false)} onSelect={onSelectFromCatalog} />
    </Box>
  )
}
