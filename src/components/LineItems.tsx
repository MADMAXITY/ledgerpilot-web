"use client"
import { Box, Card, CardContent, Stack, Typography } from '@mui/material'
import StatusChip, { type StatusChipType } from './StatusChip'

type Item = {
  name: string
  qty?: number | null
  rate?: number | null
  discount?: number | null
  hsn?: string | null
  amount?: number | null
  matched?: boolean
  match_state?: string | null
}

export default function LineItems({ items }: { items: Item[] }) {
  return (
    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 1.5 }}>
      {items.map((it, i) => (
        <Card key={i} variant="outlined">
          <CardContent>
            <Stack direction="row" justifyContent="space-between" alignItems="baseline">
              <Typography fontWeight={600}>{it.name}</Typography>
              <Typography variant="body2" sx={{ opacity: 0.8 }}>
                {it.amount != null ? it.amount.toLocaleString() : ''}
              </Typography>
            </Stack>
            <Stack direction="row" spacing={1} alignItems="center">
              <Typography variant="caption" sx={{ opacity: 0.75 }}>
                Qty: {it.qty ?? '-'} • Rate: {it.rate ?? '-'} {it.discount != null ? `• Discount: ${it.discount}` : ''}
                {it.hsn ? ` • HSN/SAC: ${it.hsn}` : ''}
              </Typography>
              {it.match_state ? (
                <StatusChip
                  type={(['to_create', 'unmatched', 'auto_matched', 'human_matched', 'created'].includes(it.match_state)
                    ? (it.match_state as StatusChipType)
                    : 'unmatched')}
                  size="small"
                />
              ) : null}
            </Stack>
          </CardContent>
        </Card>
      ))}
    </Box>
  )
}
