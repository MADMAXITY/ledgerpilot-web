"use client"
import { useMemo, useState } from 'react'
import { Box, Card, CardContent, Chip, Menu, MenuItem, Stack, Typography, Button } from '@mui/material'
import StatusChip from './StatusChip'
import CatalogSearchDialog from './CatalogSearchDialog'

type Line = {
  line_id: number
  line_no: number
  description: string | null
  item_name: string | null
  quantity: number | null
  rate: number | null
  match_state: string
}

export default function LineItemsInteractive({
  ingestionId,
  lines,
  onChanged,
}: {
  ingestionId: number | string
  lines: Line[]
  onChanged: () => void
}) {
  const [menuAnchor, setMenuAnchor] = useState<HTMLElement | null>(null)
  const [activeLine, setActiveLine] = useState<Line | null>(null)
  const [suggestions, setSuggestions] = useState<Array<{ item_id: string; name: string | null; hsn8: string | null; similarity?: number; reason?: string; rank?: number }>>([])
  const [catalogOpen, setCatalogOpen] = useState(false)

  const fetchSuggestions = async (lineId: number) => {
    try {
      const res = await fetch(`/api/lines/${lineId}/candidates?top=5`, { cache: 'no-store' })
      const json = (await res.json()) as { ok: boolean; items: Array<{ candidate_item_id: string; candidate_name: string | null; hsn8: string | null; similarity?: number; reason?: string; rank?: number }> }
      if (json.ok) {
        setSuggestions(
          (json.items || []).map((c) => ({
            item_id: c.candidate_item_id,
            name: c.candidate_name,
            hsn8: c.hsn8 || null,
            similarity: c.similarity,
            reason: c.reason,
            rank: c.rank,
          }))
        )
      } else setSuggestions([])
    } catch {
      setSuggestions([])
    }
  }

  const onMatchClick = async (el: HTMLElement, line: Line) => {
    setActiveLine(line)
    setMenuAnchor(el)
    await fetchSuggestions(line.line_id)
  }

  const closeMenu = () => {
    setMenuAnchor(null)
    setActiveLine(null)
    setSuggestions([])
  }

  const assign = async (itemId: string) => {
    if (!activeLine) return
    await fetch(`/api/ingestions/${ingestionId}/lines/${activeLine.line_id}/assign`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ item_id: itemId }),
    })
    closeMenu()
    onChanged()
  }

  const needsCreate = async (line: Line) => {
    await fetch(`/api/ingestions/${ingestionId}/lines/${line.line_id}/needs-create`, { method: 'POST' })
    onChanged()
  }

  const onSelectFromCatalog = async (it: { item_id: string; name: string | null; hsn8: string | null }) => {
    await assign(it.item_id)
    setCatalogOpen(false)
  }

  return (
    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 1.5 }}>
      {lines.map((l) => {
        const name = l.item_name || l.description || '—'
        return (
          <Card key={l.line_id} variant="outlined">
            <CardContent>
              <Stack direction="row" justifyContent="space-between" alignItems="baseline">
                <Typography fontWeight={600} sx={{ pr: 1, maxWidth: '70%' }}>
                  {name}
                </Typography>
                <Typography variant="body2" sx={{ opacity: 0.8 }}>
                  {l.quantity != null ? `Qty: ${l.quantity}` : ''} {l.rate != null ? `· Rate: ${l.rate}` : ''}
                </Typography>
              </Stack>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} sx={{ mt: 1 }} alignItems="center">
                <StatusChip type={(l.match_state as any) || 'unmatched'} size="small" />
                <Button size="small" variant="contained" onClick={(e) => onMatchClick(e.currentTarget, l)}>
                  {l.match_state === 'human_matched' ? 'Change match' : 'Match'}
                </Button>
                <Button size="small" variant="outlined" onClick={() => (setActiveLine(l), setCatalogOpen(true))}>
                  Browse catalog
                </Button>
                <Button size="small" color="warning" onClick={() => needsCreate(l)}>
                  Needs create
                </Button>
              </Stack>
            </CardContent>
          </Card>
        )
      })}

      <Menu anchorEl={menuAnchor} open={!!menuAnchor} onClose={closeMenu} anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}>
        {suggestions.map((s) => (
          <MenuItem key={s.item_id} onClick={() => assign(s.item_id)}>
            <Stack direction="row" spacing={1} alignItems="center">
              <Typography variant="body2" sx={{ minWidth: 200 }}>{s.name || s.item_id}</Typography>
              {s.hsn8 ? <Chip size="small" label={`HSN ${s.hsn8}`} /> : null}
              {typeof s.similarity === 'number' ? <Chip size="small" variant="outlined" label={`sim ${(s.similarity * 100).toFixed(0)}%`} /> : null}
            </Stack>
          </MenuItem>
        ))}
        {!suggestions.length ? <MenuItem disabled>No suggestions</MenuItem> : null}
        <MenuItem onClick={() => setCatalogOpen(true)}>Browse catalog…</MenuItem>
      </Menu>

      <CatalogSearchDialog
        open={catalogOpen}
        ingestionId={ingestionId}
        onClose={() => setCatalogOpen(false)}
        onSelect={onSelectFromCatalog}
      />
    </Box>
  )
}

